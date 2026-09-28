import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Candidato, capitalizar, fotoUrl } from "./lib";

function linhaHtml(c: Candidato): string {
  const foto = c.sqCandidato
    ? `<img src="${fotoUrl(c.uf, c.sqCandidato)}" width="48" height="48" style="border-radius:24px;object-fit:cover;background:#eee" />`
    : `<div style="width:48px;height:48px;border-radius:24px;background:#eee"></div>`;
  return `
    <tr>
      <td style="padding:8px">${foto}</td>
      <td style="padding:8px">
        <div style="font-size:12px;color:#666">${capitalizar(c.cargo)}</div>
        <div style="font-size:16px;font-weight:600">${c.nome}${c.partido ? ` (${c.partido})` : ""}</div>
      </td>
      <td style="padding:8px;text-align:right;font-size:28px;font-weight:800">${c.numero}</td>
    </tr>`;
}

function montarHtml(candidatos: Candidato[]): string {
  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family:-apple-system,sans-serif;color:#111">
        <h2 style="text-align:center">Minha Cola 2026</h2>
        <table style="width:100%;border-collapse:collapse">
          ${candidatos.map(linhaHtml).join("")}
        </table>
      </body>
    </html>`;
}

export async function imprimirCola(candidatos: Candidato[]): Promise<void> {
  await Print.printAsync({ html: montarHtml(candidatos) });
}

export async function compartilharCola(candidatos: Candidato[]): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: montarHtml(candidatos) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}
