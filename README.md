# Cola 2026

**A cola definitiva para não zerar na hora de votar.**

Chega de sair da cabine tentando lembrar aquele número de 5 dígitos do
deputado estadual. O **Cola 2026** é o app gratuito, offline e **sem viés
político** que guarda os candidatos que _você já escolheu_ — com número, foto
oficial e partido, direto dos dados abertos do TSE — prontos pra consultar (ou
imprimir!) no dia da eleição.

### [Baixar o APK (Android) — v1.0.0](https://expo.dev/artifacts/eas/4p8R5ujEBz0-l1cvgZiCC2VsJp5MZvTtJkQlzWLgqdM.apk)

---

## Por que usar

- **Dados 100% oficiais** — busca por número ou nome usando o dataset
  [`consulta_cand_2026`](https://dadosabertos.tse.jus.br/dataset/candidatos-2026)
  do Portal de Dados Abertos do TSE (mais de 20 mil candidatos).
- **Foto do candidato** — confirma visualmente que o número é de quem você
  realmente escolheu.
- **Zero viés político** — o app não recomenda, não ranqueia e não opina.
  Só ajuda você a lembrar da sua própria escolha.
- **Offline e privado** — a sua lista fica salva só no aparelho, nada é
  enviado pra nenhum servidor.
- **Imprime e compartilha** — gere sua folha de cola em PDF com um toque.

## Como funciona

1. Escolha o cargo (Presidente, Governador, Senador, Deputado Federal ou
   Estadual) e o seu estado.
2. Digite o número ou o nome do candidato — o app busca nos dados oficiais
   e mostra a foto.
3. Toque para adicionar à sua cola.
4. No dia da votação, abra o app (ou imprima a folha) e vote tranquilo.

## Rodando localmente

```bash
npm install
npm start
```

Escaneie o QR Code com o app **Expo Go** no seu Android/iPhone.

## Gerando um novo APK

```bash
npm run build:apk
```

Isso dispara um build na nuvem via [EAS Build](https://docs.expo.dev/build/introduction/).
Ao final, o link de download aparece no terminal e em
[expo.dev](https://expo.dev/accounts/badmask/projects/cola2026/builds).

### Versionamento

Segue [`CHANGELOG.md`](CHANGELOG.md): começa em `1.0.0` e cada novo APK sobe o
PATCH (`1.0.1`, `1.0.2`, ...). A versão é definida em `app.json`.

## Fonte dos dados

- Candidatos: [Portal de Dados Abertos do TSE](https://dadosabertos.tse.jus.br/dataset/candidatos-2026)
- Fotos: sistema oficial [DivulgaCandContas](https://divulgacandcontas.tse.jus.br/divulga/) do TSE

## Aviso

Este é um projeto independente e sem qualquer vínculo com partidos,
candidatos, coligações ou o próprio TSE. Sua única função é ajudar eleitores
a lembrar escolhas que eles mesmos já fizeram.
