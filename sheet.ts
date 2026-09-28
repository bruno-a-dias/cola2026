import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Candidato, capitalizar, fotoUrl } from "./lib";

// Formato retrato tipo "stories" (Instagram), com fontes grandes para
// facilitar a leitura de quem tem baixa visão.
const LARGURA = 1080;
const ALTURA = 1920;
const GITHUB_USUARIO = "bruno-a-dias";

function linhaHtml(c: Candidato): string {
  const foto = c.sqCandidato
    ? `<img src="${fotoUrl(c.uf, c.sqCandidato)}" width="180" height="180" style="border-radius:90px;object-fit:cover;background:#1e3560;flex-shrink:0" />`
    : `<div style="width:180px;height:180px;border-radius:90px;background:#1e3560;flex-shrink:0"></div>`;
  return `
    <div style="display:flex;align-items:center;gap:32px;flex:1">
      ${foto}
      <div style="flex:1;min-width:0">
        <div style="font-size:30px;font-weight:700;color:#7fa8f7;text-transform:uppercase;letter-spacing:1px">${capitalizar(c.cargo)}</div>
        <div style="font-size:46px;font-weight:800;color:#ffffff;line-height:1.15;margin-top:6px">${c.nome}</div>
        ${c.partido ? `<div style="font-size:30px;color:#a9b8d4;margin-top:4px">${c.partido}</div>` : ""}
      </div>
      <div style="font-size:120px;font-weight:900;color:#ffd75e;line-height:1;flex-shrink:0">${c.numero}</div>
    </div>`;
}

function montarHtml(candidatos: Candidato[]): string {
  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin:0;padding:0">
        <div style="width:${LARGURA}px;height:${ALTURA}px;box-sizing:border-box;padding:64px 56px;background:#0b1d3a;font-family:-apple-system,Helvetica,Arial,sans-serif;display:flex;flex-direction:column">
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:56px;font-weight:900;color:#ffffff">Minha Cola 2026</div>
            <div style="font-size:28px;color:#a9b8d4;margin-top:8px">Os números que eu escolhi pra votar</div>
          </div>

          <div style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;border-top:2px solid #1e3560;border-bottom:2px solid #1e3560;padding:12px 0">
            ${candidatos.map(linhaHtml).join("")}
          </div>

          <div style="text-align:center;margin-top:24px;font-size:26px;color:#7d8ba8">
            Desenvolvido por github.com/${GITHUB_USUARIO}
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
