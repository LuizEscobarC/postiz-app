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

## Marca LIGHTNING — logo e cores

Aplicada em `v2.23.0-lampagos.2`. Fonte dos tokens:
`ai-first/ai-first-design-system/tokens/colors.css`.

**Logos viraram assets.** Eram SVG inline com `#612BD3` chumbado dentro de
`new-layout/logo.tsx` e `ui/logo-text.component.tsx`. Agora apontam para
`public/brand/icon-*.png`, gerados do `lampagos_icon_1024.png`. O wordmark, que
desenhava a palavra "Postiz" em vetor, virou ícone + `BRAND_NAME` como texto —
um wordmark chumbado sairia de sincronia assim que o nome mudasse.

Os arquivos `public/logo.svg`, `logo-text.svg` e `favicon.png` continuam
**mortos** (zero referências) — ignorados de propósito, mexer neles é ruído.

**A armadilha do amarelo.** Os tokens vêm em OKLCH; foram convertidos para hex
porque o Tailwind daqui usa modificadores de opacidade (`bg-btnPrimary/50`), que
quebram com `oklch()` cru.

O que quase quebrou o painel: **branco sobre `brand-500` (#F2C700) dá 1.62:1** e
a WCAG AA pede 4.5:1. O roxo que saiu dava 7.51:1 com branco — por isso o
upstream usa `text-white` em todo botão primário. Trocar só o fundo deixaria
todo botão ilegível.

Por isso `--new-btn-primary` (#F2C700) anda junto de `--new-btn-primary-text`
(#171409, a *strike-ink*: 11.35:1). **Regra: nunca introduza um fundo amarelo sem
pareá-lo com a tinta escura.** Um dos 5 sites só apareceu grepando a variável em
vez da classe: `global.scss:811`, com `color: #fff !important`.

`--new-ai-btn` fica rosa de propósito — a regra da marca é que amarelo cheio é
escasso.

**Roxo que sobrou de propósito** (roxo sobrando é bug cosmético; texto ilegível é
produto quebrado):

- `--color-forth` (#612ad5): 16 usos de `bg-forth` sem token de texto pareado.
- ~64 `#612BD3` chumbados em 21 arquivos. Metade é borda/glow sem texto em cima
  (trocáveis com segurança); metade é botão que precisa do mesmo par fundo+tinta.
  Editar os 21 é churn hostil a rebase — é passo deliberado, não faxina.
- `--color-custom1..55`: nomes opacos, e em pelo menos um caso o valor atual tem
  contraste melhor que o token da marca.

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
