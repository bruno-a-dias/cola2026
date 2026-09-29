# Changelog

Versionamento: `MAJOR.MINOR.PATCH`, começando em `1.0.0`. Cada novo APK gerado
incrementa o PATCH (1.0.0 → 1.0.1 → 1.0.2 ...). A versão vive em `app.json`
(`expo.version` + `expo.android.versionCode`, que também sobe a cada build).

## 1.0.4 — 2026-09-29

- Novo botão "Ver apuração em tempo real": tela com os resultados oficiais
  do TSE por cargo/UF/turno (votos, %, situação), direto da divulgação
  oficial (`resultados.tse.jus.br`), sem projeção — atualiza sozinha a
  cada 45s
- Antes do dia da votação (ou se o TSE ainda não publicou aquele
  cargo/estado), mostra um aviso explicando e um botão pra tentar de novo

## 1.0.3 — 2026-09-29

- A lista de candidatos (geral ou filtrada) agora sempre aparece em ordem
  numérica crescente. Antes seguia a ordem bruta do arquivo do TSE, que
  agrupa por partido/coligação e dava a impressão de favorecer alguns
  partidos

## 1.0.2 — 2026-09-28

- Filtros dinâmicos combináveis: partido (lista de chips), número (prefixo)
  e nome — sem nenhum filtro, mostra a lista geral de candidatos do
  cargo/UF selecionado
- Tocar num resultado adiciona direto à cola (substitui a escolha anterior
  daquele cargo, já que só faz sentido uma por cargo)
- Fundo da tela ganha um gradiente com as cores do partido filtrado
  (quando cadastrada), voltando ao azul padrão sem filtro
- Folha impressa/compartilhada agora sempre traz os 5 cargos: quem ainda
  não foi escolhido aparece com nome/número em branco, prontos pra
  preencher depois — resolve o caso de quem ainda está indeciso

## 1.0.1 — 2026-09-28

- Layout respeita entalhes/status bar e barra de gestos (safe area) em
  Android e iOS, com respiro extra no topo e no rodapé
- Folha de cola (imprimir/compartilhar) agora no formato vertical de
  stories do Instagram (1080x1920), com fontes bem maiores para facilitar
  a leitura de quem tem baixa visão
- Crédito "Desenvolvido por github.com/bruno-a-dias" no rodapé da folha

## 1.0.0 — 2026-09-28

Primeira versão de testes.

- Cadastro pessoal de candidatos escolhidos (cargo, número, nome, partido)
- Busca por número ou nome usando o dataset oficial do TSE (Eleições 2026)
- Foto oficial do candidato (TSE) exibida ao lado do número
- Armazenamento local (offline), sem envio de dados a terceiros
- Impressão e compartilhamento da folha de cola (PDF)
