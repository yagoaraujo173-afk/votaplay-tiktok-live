# VotaPlay TikTok LIVE — pacote inicial

Este pacote é uma ponte inicial entre os eventos de presentes do TikTok LIVE e uma página de jogo. **Não é uma integração oficial do TikTok e ainda precisa ser testado em uma LIVE real.** O conector comunitário pode parar de funcionar se o TikTok mudar seus sistemas.

## O que vem incluído
- `server.mjs`: servidor Node.js com Socket.IO e conector comunitário do TikTok.
- `public/index.html`: painel para ver o estado da conexão e testar eventos.
- `public/votaplay-bridge.js`: cliente que encaminha os eventos para a página do VotaPlay por meio do evento de navegador `votaplay:game-action`.
- `render.yaml`: configuração inicial para Render.
- `package.json`: dependências e comando de inicialização.

## Caminho simples pelo celular
1. Baixe o ZIP e extraia os arquivos com o app Arquivos do Android.
2. Crie uma conta em https://github.com/ e crie um repositório chamado `votaplay-tiktok-live`.
3. Envie os arquivos e a pasta `public` para o repositório. A estrutura deve ficar assim:
   - `package.json`
   - `server.mjs`
   - `render.yaml`
   - `README.md`
   - `public/index.html`
   - `public/votaplay-bridge.js`
4. Crie uma conta em https://render.com/ e escolha **New + → Web Service**.
5. Conecte o repositório GitHub.
6. Use:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Runtime: Node
7. Em **Environment**, adicione `TIKTOK_USERNAME` com o valor `songsmk_` (sem @). Publique o serviço.
8. Abra `https://SEU-SERVICO.onrender.com/health`. Deve aparecer um JSON com `"ok":true`.
9. Abra a página raiz do serviço (`https://SEU-SERVICO.onrender.com/`) para ver o painel. Clique em “Enviar evento de teste” para confirmar que o painel e o servidor conversam.
10. Quando sua LIVE estiver ativa, observe se o estado fica conectado e se presentes reais aparecem. O evento de teste não comprova que a conexão real do TikTok funciona.

## Ligando ao site VotaPlay que já está no Netlify
O `public/votaplay-bridge.js` é um adaptador genérico, não modifica automaticamente os jogos existentes. Para usá-lo no seu site:
1. Copie `public/votaplay-bridge.js` para a pasta publicada do VotaPlay.
2. Abra o HTML principal e, antes de `</body>`, inclua as duas linhas abaixo. Troque a URL do backend pela URL real do Render:

```html
<script src="https://SUA-URL-DO-RENDER.onrender.com/socket.io/socket.io.js"></script>
<script src="/votaplay-bridge.js"></script>
```

3. No código do jogo, escute o evento `votaplay:game-action`. Exemplo:

```js
window.addEventListener("votaplay:game-action", (event) => {
  const action = event.detail;
  if (action.type === "gift") {
    console.log("Presente recebido:", action.giftName, "de", action.username);
    // Aqui deve entrar a regra específica do jogo.
  }
});
```

A regra de cada jogo ainda precisa ser conectada. O código não adivinha automaticamente qual ação um presente deve executar em cada jogo; isso depende do código-fonte atual do VotaPlay e das regras desejadas.

## Limitações e segurança
- A biblioteca é comunitária/não oficial e pode precisar de correções.
- Alguns serviços gratuitos podem suspender o servidor quando ficam sem uso.
- A rota de teste é apenas para diagnóstico; não exponha controles administrativos sem autenticação.
- Não coloque senhas, cookies ou códigos de acesso do TikTok no código ou no GitHub.
- Nunca compartilhe sua senha ou códigos comigo.
