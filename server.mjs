import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});

app.use(express.static("public"));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const USERNAME = (process.env.TIKTOK_USERNAME || "songsmk_").replace(/^@/, "");
let connection = null;
let status = { connected: false, username: USERNAME, message: "Servidor iniciado; aguardando conexão com TikTok LIVE." };
const recentEvents = [];
const MAX_EVENTS = 50;

function publishStatus(message, connected = status.connected) {
  status = { connected, username: USERNAME, message, updatedAt: new Date().toISOString() };
  io.emit("bridge-status", status);
  console.log("[status]", status);
}

function publishGift(data) {
  const event = { ...data, receivedAt: new Date().toISOString() };
  recentEvents.unshift(event);
  if (recentEvents.length > MAX_EVENTS) recentEvents.pop();
  io.emit("gift-event", event);

  // Generic game event: the site's game code can react to this.
  io.emit("game-action", {
    type: "gift",
    username: event.username,
    giftName: event.giftName,
    giftId: event.giftId,
    repeatCount: event.repeatCount,
    diamondCount: event.diamondCount,
    timestamp: event.receivedAt
  });
  console.log("[gift]", event);
}

async function connectTikTok() {
  if (!USERNAME) {
    publishStatus("Configure TIKTOK_USERNAME nas variáveis de ambiente.", false);
    return;
  }
  try {
    publishStatus(`Tentando conectar à LIVE de @${USERNAME}…`, false);
    connection = new TikTokLiveConnection(USERNAME, {
      processInitialData: false,
      enableExtendedGiftInfo: true
    });

    connection.on(WebcastEvent.CONNECTED, (state) => {
      publishStatus(`Conectado à LIVE de @${USERNAME}.`, true);
    });

    connection.on(WebcastEvent.DISCONNECTED, () => {
      publishStatus("TikTok desconectou o servidor. Pode ser necessário reiniciar ou tentar novamente.", false);
    });

    connection.on(WebcastEvent.ERROR, (err) => {
      publishStatus(`Erro do conector TikTok: ${err?.message || "erro desconhecido"}`, false);
    });

    connection.on(WebcastEvent.GIFT, (data) => {
      // TikTok may send repeated gift updates; keep the repeat count for game rules.
      const gift = data?.giftDetails || {};
      publishGift({
        username: data?.user?.uniqueId || data?.user?.nickname || "espectador",
        giftName: gift?.giftName || data?.giftName || "Presente",
        giftId: data?.giftId ?? gift?.giftId ?? null,
        repeatCount: data?.repeatCount ?? 1,
        diamondCount: gift?.diamondCount ?? data?.diamondCount ?? 0,
        repeatEnd: data?.repeatEnd ?? true
      });
    });

    await connection.connect();
  } catch (err) {
    publishStatus(`Não foi possível conectar: ${err?.message || "erro desconhecido"}`, false);
    console.error(err);
  }
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "VotaPlay TikTok LIVE bridge" }));
app.get("/api/status", (_req, res) => res.json({ ...status, recentEvents }));
app.get("/api/events", (_req, res) => res.json(recentEvents));

io.on("connection", (socket) => {
  socket.emit("bridge-status", status);
  socket.emit("recent-events", recentEvents);
  socket.on("test-gift", () => {
    publishGift({
      username: "teste",
      giftName: "Presente de teste",
      giftId: "test",
      repeatCount: 1,
      diamondCount: 1,
      repeatEnd: true,
      isTest: true
    });
  });
  socket.on("game-action-request", (action) => {
    // Optional admin/game clients can request a controlled action.
    // This is not authentication; add protection before exposing admin controls.
    if (action && typeof action === "object") io.emit("game-action", { ...action, requestedAt: new Date().toISOString() });
  });
});

server.listen(PORT, () => {
  console.log(`VotaPlay bridge listening on port ${PORT}`);
  connectTikTok();
});
