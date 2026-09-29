import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ApuracaoIndisponivel,
  buscarApuracao,
  CandidatoApurado,
  ResultadoApuracao,
} from "./apuracao";
import { capitalizar, CARGOS, Cargo, formatarNumero, UFS, Uf } from "./lib";

const ATUALIZA_A_CADA_MS = 45_000;

export default function Apuracao({ aoVoltar }: { aoVoltar: () => void }) {
  const insets = useSafeAreaInsets();
  const [cargo, setCargo] = useState<Cargo>("PRESIDENTE");
  const [uf, setUf] = useState<Uf>("SP");
  const [turno, setTurno] = useState<1 | 2>(1);
  const [resultado, setResultado] = useState<ResultadoApuracao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const ufAtual = cargo === "PRESIDENTE" ? "BR" : uf;

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const r = await buscarApuracao(cargo, ufAtual, turno);
      setResultado(r);
    } catch (e) {
      setResultado(null);
      setErro(
        e instanceof ApuracaoIndisponivel
          ? e.message
          : "Não consegui carregar a apuração agora. Tente de novo."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, ATUALIZA_A_CADA_MS);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargo, uf, turno]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={aoVoltar} style={styles.voltar}>
          <Text style={styles.voltarTexto}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Apuração em tempo real</Text>
        <Text style={styles.subtitulo}>
          Direto da divulgação oficial do TSE. Sem projeção, só o que já foi contado.
        </Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        data={CARGOS}
        keyExtractor={(c) => c}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.chip, cargo === c && styles.chipAtivo]}
            onPress={() => setCargo(c)}
          >
            <Text style={[styles.chipTexto, cargo === c && styles.chipTextoAtivo]}>
              {capitalizar(c)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.linhaSecundaria}>
        {cargo !== "PRESIDENTE" && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsUf}
            data={UFS}
            keyExtractor={(u) => u}
            renderItem={({ item: u }) => (
              <TouchableOpacity
                style={[styles.chipUf, uf === u && styles.chipAtivo]}
                onPress={() => setUf(u)}
              >
                <Text style={[styles.chipTexto, uf === u && styles.chipTextoAtivo]}>{u}</Text>
              </TouchableOpacity>
            )}
          />
        )}
        <View style={styles.turnos}>
          {[1, 2].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chipUf, turno === t && styles.chipAtivo]}
              onPress={() => setTurno(t as 1 | 2)}
            >
              <Text style={[styles.chipTexto, turno === t && styles.chipTextoAtivo]}>{t}º turno</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {carregando && !resultado && (
        <View style={styles.centro}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {erro && (
        <View style={styles.centro}>
          <Text style={styles.erro}>{erro}</Text>
          <TouchableOpacity style={styles.botaoTentar} onPress={carregar}>
            <Text style={styles.botaoTentarTexto}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      )}

      {resultado && (
        <>
          <View style={styles.status}>
            <Text style={styles.statusApurado}>{resultado.apuradoPct.toFixed(0)}% apurado</Text>
            <Text style={styles.statusAtualizado}>Atualizado às {resultado.atualizadoEm}</Text>
            <Text style={styles.statusDetalhe}>
              Comparecimento {resultado.totais.comparecimentoPct.toFixed(1)}% · Abstenção{" "}
              {resultado.totais.abstencaoPct.toFixed(1)}% · Brancos {formatarNumero(resultado.totais.brancos)} ·
              Nulos {formatarNumero(resultado.totais.nulos)}
            </Text>
          </View>

          <FlatList
            style={styles.lista}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            data={resultado.candidatos}
            keyExtractor={(c) => c.numero + c.nome}
            renderItem={({ item }) => <LinhaCandidato item={item} />}
          />
        </>
      )}
    </View>
  );
}

function LinhaCandidato({ item }: { item: CandidatoApurado }) {
  return (
    <View style={styles.candidato}>
      <Text style={styles.posicao}>{item.posicao}º</Text>
      <View style={styles.candidatoInfo}>
        <Text style={styles.candidatoNome}>
          {item.nome}
          {item.partido ? ` (${item.partido})` : ""}
        </Text>
        <Text style={[styles.candidatoSituacao, item.eleito && styles.eleito]}>{item.situacao}</Text>
      </View>
      <View style={styles.candidatoVotos}>
        <Text style={styles.candidatoPct}>{item.pct.toFixed(2)}%</Text>
        <Text style={styles.candidatoVotosTexto}>{formatarNumero(item.votos)} votos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1d3a" },
  cabecalho: { paddingHorizontal: 16 },
  voltar: { alignSelf: "flex-start", marginBottom: 8 },
  voltarTexto: { color: "#7fa8f7", fontSize: 15, fontWeight: "600" },
  titulo: { fontSize: 22, fontWeight: "700", color: "#fff" },
  subtitulo: { fontSize: 13, color: "#a9b8d4", marginTop: 4 },
  chips: { marginTop: 14, paddingHorizontal: 16 },
  linhaSecundaria: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  chipsUf: { flex: 1 },
  turnos: { flexDirection: "row" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#132a52",
    marginRight: 8,
  },
  chipUf: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#132a52",
    marginRight: 6,
  },
  chipAtivo: { backgroundColor: "#3467e0" },
  chipTexto: { color: "#a9b8d4", fontSize: 13 },
  chipTextoAtivo: { color: "#fff", fontWeight: "700" },
  centro: { alignItems: "center", justifyContent: "center", padding: 32 },
  erro: { color: "#a9b8d4", textAlign: "center", fontSize: 14, lineHeight: 20 },
  botaoTentar: {
    marginTop: 16,
    backgroundColor: "#3467e0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  botaoTentarTexto: { color: "#fff", fontWeight: "700" },
  status: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: "#132a52",
    borderRadius: 12,
  },
  statusApurado: { color: "#ffd75e", fontSize: 20, fontWeight: "800" },
  statusAtualizado: { color: "#a9b8d4", fontSize: 12, marginTop: 2 },
  statusDetalhe: { color: "#7d8ba8", fontSize: 12, marginTop: 6 },
  lista: { flex: 1, paddingHorizontal: 16, marginTop: 12 },
  candidato: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#132a52",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  posicao: { color: "#7fa8f7", fontSize: 18, fontWeight: "800", width: 34 },
  candidatoInfo: { flex: 1 },
  candidatoNome: { color: "#fff", fontSize: 15, fontWeight: "600" },
  candidatoSituacao: { color: "#a9b8d4", fontSize: 12, marginTop: 2 },
  eleito: { color: "#4ade80", fontWeight: "700" },
  candidatoVotos: { alignItems: "flex-end" },
  candidatoPct: { color: "#ffd75e", fontSize: 18, fontWeight: "800" },
  candidatoVotosTexto: { color: "#7d8ba8", fontSize: 11, marginTop: 2 },
});
