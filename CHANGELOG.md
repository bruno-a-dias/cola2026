# Changelog

Versionamento: `MAJOR.MINOR.PATCH`, começando em `1.0.0`. Cada novo APK gerado
incrementa o PATCH (1.0.0 → 1.0.1 → 1.0.2 ...). A versão vive em `app.json`
(`expo.version` + `expo.android.versionCode`, que também sobe a cada build).

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
