# PRISMA ASSIST

Site institucional de uma plataforma SaaS B2B para atendimento por WhatsApp com inteligência artificial, automações e gestão de conversas

**Estado:** projeto em desenvolvimento — demonstração frontend com dados fictícios, sem backend ou integrações reais conectadas

## Stack

React 19, TypeScript, Vite 6 e Tailwind CSS 4, com ícones Lucide/Hugeicons, fontes locais via Fontsource e componentes React Bits integrados ao site (TiltedCard, Carousel e ScrollStack)

## Executar localmente

Requisitos: Node.js 22 LTS ou superior compatível e npm

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:5186

```sh
npm run build
npx vite preview --host 127.0.0.1 --port 5187
```

O build verifica TypeScript e gera `dist/`. Para o smoke test, com o preview em execução:

```sh
npx playwright install chromium
node scripts/verify-site.mjs http://127.0.0.1:5187
```

Opcionalmente defina `BROWSER_PATH` para um Chromium/Edge já instalado

## Estrutura

- `src/` — página institucional, estilos, composição dos painéis e seções
- `src/components/` — componentes visuais utilizados pelo aplicativo
- `public/` — favicon e assets originais, com registros de geração em `public/assets/`
- `scripts/verify-site.mjs` — verificação portátil do site
- `licenses/` e `THIRD_PARTY_NOTICES.md` — licenças e atribuições

Os painéis do produto e o exemplo de agendamento são ilustrativos. A disponibilidade de integrações depende de compatibilidade técnica, permissões e viabilidade

## Continuar em uma nova sessão de Codex

Clone este repositório, abra a pasta e peça ao Codex para ler este README e inspecionar `src/main.tsx`, `src/Institutional.tsx` e os componentes relacionados à tarefa. Execute `npm ci`, `npm run dev` e `npm run build`. Preserve a direção visual aprovada e limite os ajustes ao escopo solicitado; publicação e conexões externas exigem autorização explícita

## Preservação e licenças

O repositório preserva o código atual e os assets do projeto. Dependências instaladas, builds, evidências locais de QA, ferramentas privadas, planos históricos e prompts completos de terceiros em `REFERENCE/` ficam fora do Git, sem serem apagados da pasta original

Consulte [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Os componentes React Bits são distribuídos somente como parte deste site, sujeitos à licença própria. Nenhuma licença geral adicional é concedida ao código original deste projeto por este README

## Deploy (jv-server)

O site roda em Docker (build do Vite + nginx) atrás do Caddy compartilhado do servidor, em `prismaassist.com` e `www.prismaassist.com`. O sistema fica em `app.prismaassist.com` (repositório `prisma-assist`).

```sh
git pull --ff-only
docker compose up -d --build
```

O container entra na rede `infra_default` com o alias `prismaassist-site`; o bloco correspondente fica no `~/caddy/Caddyfile` do servidor
