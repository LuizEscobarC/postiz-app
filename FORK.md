# Fork da Lampagos — contrato de manutenção

Fork de [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) para
rodar o Postiz com a nossa marca em <https://automedia.lampagos.com>, sem perder
os fixes do upstream.

Por que um fork: o Postiz **não tem white-label nativo**. Não existe
`NEXT_PUBLIC_BRAND` nem equivalente — o nome do produto está espalhado em código,
e os logos são SVG inline dentro de componentes React, não arquivos trocáveis.

## Modelo de branches

| | |
|---|---|
| branch de marca | `lampagos` — longa duração, é dela que saem as tags |
| base | tag `v2.23.0`, commit `1e4c8dd5` |
| remote `origin` | `LuizEscobarC/postiz-app` (este fork) |
| remote `upstream` | `gitroomhq/postiz-app` |
| imagem | `ghcr.io/luizescobarc/postiz-app:<tag>` |

`v2.23.0` não foi escolhida ao acaso: é exatamente a imagem que estava em
produção quando a integração com o Instagram foi validada. Começar do que já
funciona significa que qualquer quebra vem da nossa mudança, não da versão.

## Como a marca foi implementada

**O nome do produto é a variável de ambiente `BRAND_NAME`.** O default é
`Postiz`, então tirar a variável restaura o comportamento do upstream.

Implementação em `libraries/helpers/src/utils/brand.ts`, injetada no cliente pelo
mesmo mecanismo que o upstream já usava para `isGeneral` (as três layouts passam
a prop para `VariableContextComponent`, que espelha em `window.vars`). Nada de
mecanismo novo — quanto mais parecido com o upstream, mais barato o rebase.

Cuidado ao mexer: `isGeneral` **não** é um switch de marca. Ele é o resto do
produto antigo "Gitroom" e também controla comportamento (login OIDC, abas de
settings, billing, redirects, analytics). Ele foi mantido intacto; só deixou de
ser usado onde servia apenas para escolher o nome.

Dois lugares ficaram de fora de propósito:

- `apps/orchestrator/src/workflows/digest.email.workflow.ts:60` — o assunto
  `[Postiz] Your latest notifications` continua hardcoded. Workflows do Temporal
  rodam num sandbox V8 determinístico onde `process` não existe; chamar
  `brandName()` ali quebraria os e-mails em runtime. Para brandear de verdade, o
  assunto precisa ser montado na activity `sendEmailAsync` ou passado como
  argumento do workflow — mudança de comportamento, não de marca.
- `libraries/react-shared-libraries/src/helpers/testomonials.tsx` — 13
  depoimentos falsos citando Postiz, num array de JSX avaliado no import, fora de
  qualquer escopo de componente. O caminho barato é remover o uso em
  `auth/layout.tsx` (diff de uma linha) em vez de reescrever os textos.

## O que ainda depende de decisão de design

Nada disso foi mexido — precisa da logo e das cores reais:

1. **Logos.** São SVG inline, não arquivos:
   `apps/frontend/src/components/new-layout/logo.tsx` (símbolo) e
   `apps/frontend/src/components/ui/logo-text.component.tsx` (marca escrita).
   Os arquivos `public/logo.svg`, `logo-text.svg` e `favicon.png` são **mortos** —
   zero referências no código. Os que valem são `public/favicon.ico` e
   `public/postiz.svg`.
2. **Cor da marca.** `apps/frontend/src/app/colors.scss`, `--new-btn-primary:
   #612bd3`. O `tailwind.config.cjs` não tem cor literal nenhuma, só aliases
   `var(--…)`.
   **Armadilha:** `#612BD3` está hardcoded em ~24 arquivos fora do `colors.scss`.
   Editar os 24 é suicídio de rebase — prefira sobrescrever por CSS.

## Como atualizar com os fixes do upstream

O upstream **só publica imagem em push de tag**
(`.github/workflows/build-containers.yml`), então `:latest` é sempre apelido da
tag mais recente, nunca o HEAD da main. Ignore o `version.txt`: é arquivo morto,
não é lido por nada e está parado desde 2025.

```bash
just postiz-fork-check                    # traz tags novas e mostra a base atual
just postiz-fork-rebase v2.24.0           # rebase da branch de marca na tag nova
# resolver conflitos, conferir o diff
just postiz-fork-release v2.24.0-lampagos.1   # tag + push -> dispara o CI
```

O CI publica `ghcr.io/luizescobarc/postiz-app:v2.24.0-lampagos.1`. Pegue o digest
e atualize o pin em `deploy/postiz/docker-compose.prod.yaml` no repo
`um_programador_melhor`:

```bash
docker pull ghcr.io/luizescobarc/postiz-app:v2.24.0-lampagos.1
docker image inspect ghcr.io/luizescobarc/postiz-app:v2.24.0-lampagos.1 \
  --format '{{index .RepoDigests 0}}'
```

**Termine publicando um post de verdade.** Container `healthy` não significa API
no ar: o healthcheck bate em `/` (o frontend), e o backend NestJS sobe ~40s
depois. Nessa janela `/api/*` devolve 502 e o painel falha em silêncio. Espere
`curl -s http://127.0.0.1:4007/api/auth/can-register` responder antes de concluir
qualquer coisa.

## Onde o rebase vai doer

Ranking apurado por `git log` de churn upstream em cada arquivo:

| risco | arquivos |
|---|---|
| **baixo** | `new-layout/logo.tsx`, `ui/logo-text.component.tsx`, `colors.scss`, assets em `public/`, os 17 `(site)/**/page.tsx` de metadata |
| **médio** | `tailwind.config.cjs`, `testomonials.tsx`, `logout.component.tsx` |
| **alto** | `app/(app)/layout.tsx`, `auth/layout.tsx`, `register.tsx`, `global.scss` |
| **altíssimo, mas trivial** | `locales/en/translation.json` — muda em toda PR de feature, mas conflito de JSON se resolve em segundos |

O `build-containers.yml` também vai conflitar, porque foi modificado. Por isso o
nome da imagem foi hoisted para um único `env: IMAGE` no topo — na maioria dos
rebases é a única linha a reconciliar.

## Credenciais de redes sociais não são problema do fork — são do overlay

Registrado aqui porque o sintoma aponta para a aplicação e leva a investigar o
lugar errado (foi o que aconteceu com o TikTok).

O `docker-compose.yaml` do upstream declara as credenciais de **todas** as redes
com valor fixo vazio (`TIKTOK_CLIENT_ID: ''` etc.). Se o overlay de produção não
redeclarar a variável, esse `''` vence e o `.env` é ignorado em silêncio — sem
erro no boot, porque `${VAR:-}` degrada para vazio de propósito. O erro só
aparece na tela de OAuth da rede: `client_key` no TikTok, `client_id=` vazio no
LinkedIn.

Nada disso passa pelo código do fork. Antes de suspeitar da nossa imagem:

```bash
docker compose ... exec -T postiz printenv TIKTOK_CLIENT_ID < /dev/null
```

Vazio → é o overlay (`deploy/postiz/docker-compose.prod.yaml` no repo
`um_programador_melhor`), não o fork. O `< /dev/null` importa: sem ele o
`exec -T` consome o resto do script pela stdin e os comandos seguintes somem
sem erro.

Os nomes das variáveis vêm do provider da rede dentro da imagem:

```bash
grep -oE '[A-Z]+_CLIENT_[A-Z]+' \
  apps/backend/src/../../libraries/nestjs-libraries/src/integrations/social/<rede>.provider.js
```

## Mudanças no CI deste fork

| arquivo | o que mudou |
|---|---|
| `build-containers.yml` | imagem → `ghcr.io/luizescobarc/postiz-app`; `permissions: packages: write`; arm64 desligado (produção é x86_64 na Hetzner); **sem tag `:latest`** — o deploy pina por digest, e uma tag flutuante só confundiria com a do upstream |
| `build.yml` | `push` limitado à branch `lampagos` |
| `stale.yml` | `schedule` desligado |
| `build-extension.yaml`, `publish-extension.yml`, `issue-label-triggers.yml` | travados com `if: github.repository == 'gitroomhq/postiz-app'` — dependem de secrets que não temos |

Para reativar arm64: descomente as duas linhas da matriz **e** mude `ARM64` para
`"true"` no job do manifest.

## Licença

O Postiz é **AGPL-3.0**. Modificar e servir pela rede aciona a obrigação de
disponibilizar o código modificado aos usuários do serviço. Hoje o painel é de
uma pessoa só, então na prática não muda nada. Se um dia atender terceiros, este
fork precisa ser público. *(Não sou advogado — se virar produto, confirme com
quem seja.)*
