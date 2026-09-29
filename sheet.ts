import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Candidato, capitalizar, fotoUrl, preencherCargosFaltantes } from "./lib";

// Formato retrato tipo "stories" (Instagram), com fontes grandes para
// facilitar a leitura de quem tem baixa visão.
const LARGURA = 1080;
const ALTURA = 1920;
const GITHUB_USUARIO = "bruno-a-dias";

function linhaHtml(c: Candidato): string {
  const decidido = c.nome.trim().length > 0;

  const foto = c.sqCandidato
    ? `<img src="${fotoUrl(c.uf, c.sqCandidato)}" width="180" height="180" style="border-radius:90px;object-fit:cover;background:#1e3560;flex-shrink:0" />`
    : `<div style="width:180px;height:180px;border-radius:90px;border:3px dashed #3a5590;background:#132a52;flex-shrink:0"></div>`;

  const nome = decidido
    ? `<div style="font-size:46px;font-weight:800;color:#ffffff;line-height:1.15;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nome}</div>`
    : `<div style="font-size:32px;font-weight:600;color:#5f75a0;line-height:1.15;margin-top:6px;border-bottom:3px dashed #3a5590;padding-bottom:10px">a preencher</div>`;

  const partido = c.partido
    ? `<div style="font-size:30px;color:#a9b8d4;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.partido}</div>`
    : "";

  const numero = decidido
    ? `<div style="font-size:120px;font-weight:900;color:#ffd75e;line-height:1;flex-shrink:0">${c.numero}</div>`
    : `<div style="font-size:64px;font-weight:900;color:#3a5590;line-height:1;flex-shrink:0">– – –</div>`;

  return `
    <div style="display:flex;align-items:center;gap:32px;flex:1">
      ${foto}
      <div style="flex:1;min-width:0">
        <div style="font-size:30px;font-weight:700;color:#7fa8f7;text-transform:uppercase;letter-spacing:1px">${capitalizar(c.cargo)}</div>
        ${nome}
        ${partido}
      </div>
      ${numero}
    </div>`;
}

function montarHtml(candidatos: Candidato[]): string {
  const linhas = preencherCargosFaltantes(candidatos);
  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin:0;padding:0;overflow:hidden">
        <div style="width:${LARGURA}px;height:${ALTURA}px;box-sizing:border-box;padding:64px 56px;background:#0b1d3a;font-family:-apple-system,Helvetica,Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden">
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:56px;font-weight:900;color:#ffffff">Minha Cola 2026</div>
            <div style="font-size:28px;color:#a9b8d4;margin-top:8px">Os números que eu escolhi pra votar</div>
          </div>

          <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;border-top:2px solid #1e3560;border-bottom:2px solid #1e3560;padding:12px 0;overflow:hidden;min-height:0">
            ${linhas.map(linhaHtml).join("")}
          </div>

          <div style="text-align:center;margin-top:24px;font-size:26px;color:#7d8ba8">
            Desenvolvido por: <a href="https://github.com/${GITHUB_USUARIO}" style="color:#ffd75e;font-weight:800;text-decoration:none">github.com/${GITHUB_USUARIO}</a>
          </div>
        </div>
      </body>
    </html>`;
}

export async function imprimirCola(candidatos: Candidato[]): Promise<void> {
  await Print.printAsync({ html: montarHtml(candidatos), width: LARGURA, height: ALTURA });
}

export async function compartilharCola(candidatos: Candidato[]): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html: montarHtml(candidatos),
    width: LARGURA,
    height: ALTURA,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}
