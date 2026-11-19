# Demonstração local PRISMA ASSIST

Requer Node.js 24 e a variável privada `GROQ_API_KEY` em `.env.local` na raiz. Nunca usar prefixo `VITE_` para a chave.

Executar em duas terminais, a partir da raiz:

```text
npm run dev
npm run dev:api
```

Frontend: http://127.0.0.1:5186/testar
Backend: http://127.0.0.1:5187 (somente loopback, sem acesso direto do frontend ao Groq).
Modelo fixo: `openai/gpt-oss-20b`; nenhuma ferramenta habilitada.

## Modo desenvolvedor local

`npm run dev:api` passa `--development`. O seletor em `/testar` só é oferecido quando esse arranque e `PRISMA_DEVELOPER_MODE=true` em `.env.local` estão ativos. Reiniciar o backend após mudar a configuração. Sem a flag, sem o argumento ou com `NODE_ENV=production`, o backend recusa a mudança e aplica demonstração, inclusive a sessões antes salvas como desenvolvedor. O frontend de produção não renderiza o seletor.

A escolha é persistida por sessão no SQLite, inclusive após recarregar/reiniciar. Modo desenvolvedor libera somente o teto de cinco mensagens. Todos os envios concluídos continuam sendo contados; voltar a demonstração após cinco ou mais bloqueia novos envios sem apagar histórico. Não redefine quota nem apaga mensagens. Não há bypass dos limites de IP/dia, frequência, concorrência, tokens, timeout ou cotas de Groq. Requisições encaminhadas por proxies externos são rejeitadas. Isto não substitui autenticação para um serviço publicado.

## Proteções e persistência

- Sessão aleatória em cookie HttpOnly, SameSite=Strict, duração de 30 dias. A sessão e o histórico permanecem no SQLite `.local-demo/sessions.sqlite`, excluído de Git e bloqueado pelo Vite.
- Cinco respostas concluídas por sessão. A quinta é entregue antes do bloqueio; erro do provedor não desconta mensagem. O histórico é enviado ao modelo pelo servidor, nunca aceito do cliente.
- Bloqueio de concorrência por sessão, intervalo mínimo de 4 segundos, mensagem até 800 caracteres / corpo até 4096 bytes. Máximo de 1000 tokens de saída, incluindo raciocínio; timeout de 25 segundos, sem retry automático ao provedor.
- Limites adicionais persistidos: 20 tentativas de modelo por IP/dia, 100 globais/dia e 10 novas sessões por IP/dia. Tentativas com erro também contam nesses limites antiabuso. Até duas chamadas simultâneas globais e 120 requisições por IP/minuto. No uso local, os visitantes compartilham o IP de loopback.
- Origin e Host locais obrigatórios para envio; nenhuma CORS aberta. Dados de demonstração somente. Não registrar chaves, prompts, respostas ou erros brutos do provedor.
- Sem conta empresarial, WhatsApp, agenda real ou humano conectado. O botão de mais acesso permanece desabilitado, com destino pendente.
- Limpar cookies cria uma sessão nova, sujeita aos limites adicionais de IP; isto não é identidade autenticada. Não publicar este backend como serviço comercial.
- Respostas generativas podem falhar ou inventar informações: instruções de grounding e rejeição de contatos/horários não autorizados reduzem o risco, sem garantia absoluta. O visitante deve usar somente dados fictícios.
- Uma interrupção abrupta durante chamada pode consumir cota no provedor sem resposta persistida; a sessão não é descontada. Uma resposta já persistida continua disponível após recarregar, mesmo que o navegador tenha perdido a conexão.

## Verificação

`npm run test:demo` verifica limite, concorrência, reinício, isolamento de origem, erros e respostas inválidas com um provedor de teste controlado, sem consumir Groq. `npm run build` verifica TypeScript e bundle. A implementação real nunca substitui erros por respostas simuladas.
