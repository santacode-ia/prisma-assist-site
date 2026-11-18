#!/usr/bin/env bash
# Deploy do site institucional no jv-server. Rode no clone de produção, sempre na main.
#
# Uso:
#   ./deploy.sh            deploy completo: valida, git pull, build, sobe e confere o site
#   ./deploy.sh status     estado do container e checagem pública
#   ./deploy.sh logs       acompanha os logs do nginx
#   ./deploy.sh restart    reinicia o container sem rebuild
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE=(docker compose -f "$ROOT/compose.yaml")
SERVICE="site"
DOMAINS=(prismaassist.com www.prismaassist.com)

info() { printf '\033[1;36m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; exit 1; }

check_server() {
  command -v docker >/dev/null 2>&1 || fail "'docker' não encontrado."
  docker network inspect infra_default >/dev/null 2>&1 \
    || fail "A rede externa infra_default (Caddy compartilhado) não existe neste servidor."
}

# Atualiza o código pelo git: só na main e sem alterações locais (nada é editado à mão no servidor).
update_code() {
  cd "$ROOT"
  local branch before
  branch="$(git rev-parse --abbrev-ref HEAD)"
  [[ "$branch" == "main" ]] \
    || fail "O clone de produção está na branch '$branch'. Volte para a main (git checkout main)."
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    git status --short --untracked-files=no >&2
    fail "Há alterações locais no servidor. Toda mudança passa pelo git; descarte ou commite antes."
  fi
  before="$(git rev-parse --short HEAD)"
  git pull --ff-only --quiet
  info "Código: $before -> $(git rev-parse --short HEAD)"
}

# Confere o nginx de dentro do container (busybox wget da imagem alpine).
check_container() {
  for _ in $(seq 1 10); do
    if "${COMPOSE[@]}" exec -T "$SERVICE" wget -q -O /dev/null http://127.0.0.1/ 2>/dev/null; then
      info "Container respondendo."
      return 0
    fi
    sleep 2
  done
  warn "O container não respondeu. Últimos logs:"
  "${COMPOSE[@]}" logs --tail=50 "$SERVICE" >&2
  exit 1
}

# Confere de fora (DNS + Caddy compartilhado + TLS), não só o container.
check_public() {
  local domain ok=0
  for domain in "${DOMAINS[@]}"; do
    if curl -fsS -o /dev/null --max-time 10 "https://$domain/"; then
      info "Público OK: https://$domain/"
    else
      warn "https://$domain/ não respondeu. Confira o DNS e o bloco no ~/caddy/Caddyfile."
      ok=1
    fi
  done
  return "$ok"
}

deploy() {
  check_server
  update_code
  info "Construindo e subindo..."
  "${COMPOSE[@]}" up -d --build --remove-orphans
  check_container
  check_public || true
  docker image prune -f >/dev/null
  "${COMPOSE[@]}" ps
  info "Deploy concluído: $(git -C "$ROOT" rev-parse --short HEAD)"
}

main() {
  case "${1:-}" in
    "" | up) deploy ;;
    status)
      "${COMPOSE[@]}" ps
      check_public || true
      ;;
    logs) "${COMPOSE[@]}" logs -f --tail=100 "$SERVICE" ;;
    restart)
      "${COMPOSE[@]}" restart "$SERVICE"
      check_container
      ;;
    -h | --help | help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//' ;;
    *) fail "Comando desconhecido: $1 (use ./deploy.sh help)" ;;
  esac
}

# Numa linha só: o git pull pode trocar este arquivo durante a execução, e o bash já leu tudo o que vai rodar.
main "$@"; exit
