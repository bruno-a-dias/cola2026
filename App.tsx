import { useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import dadosJson from "./assets/candidatos.json";
import {
  CandidatoTSE,
  capitalizar,
  CARGOS,
  Cargo,
  Candidato,
  corDeFundo,
  filtrarCandidatos,
  fotoUrl,
  ordenarPorCargo,
  partidosDisponiveis,
  UFS,
  Uf,
} from "./lib";
import { carregarCandidatos, salvarCandidatos } from "./storage";
import { compartilharCola, imprimirCola } from "./sheet";

const dados = dadosJson as unknown as { geradoEm: string; porUf: Record<string, CandidatoTSE[]> };
const FUNDO_PADRAO = ["#0b1d3a", "#0b1d3a"];

export default function App() {
  return (
    <SafeAreaProvider>
      <Conteudo />
    </SafeAreaProvider>
  );
}

function Conteudo() {
  const insets = useSafeAreaInsets();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [cargo, setCargo] = useState<Cargo>("PRESIDENTE");
  const [uf, setUf] = useState<Uf>("SP");
  const [filtroPartido, setFiltroPartido] = useState("");
  const [filtroNumero, setFiltroNumero] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [enviando, setEnviando] = useState<"imprimir" | "compartilhar" | null>(null);

  useEffect(() => {
    carregarCandidatos().then(setCandidatos);
  }, []);

  const ufAtual = cargo === "PRESIDENTE" ? "BR" : uf;

  function limparFiltros() {
    setFiltroPartido("");
    setFiltroNumero("");
    setFiltroNome("");
  }

  const partidos = useMemo(
    () => partidosDisponiveis(dados.porUf, cargo, ufAtual),
    [cargo, ufAtual]
  );

  const resultados = useMemo(
    () =>
      filtrarCandidatos(dados.porUf, cargo, ufAtual, {
        partido: filtroPartido || undefined,
        numero: filtroNumero,
        nome: filtroNome,
      }),
    [cargo, ufAtual, filtroPartido, filtroNumero, filtroNome]
  );

  const corFundo = filtroPartido ? corDeFundo(filtroPartido) : [];
  const fundo = corFundo.length ? corFundo : FUNDO_PADRAO;

  function adicionar(c: CandidatoTSE) {
    const novo: Candidato = {
      id: String(Date.now()),
      cargo,
      nome: capitalizar(c.nomeUrna),
      numero: c.numero,
      partido: c.partido,
      uf: ufAtual,
      sqCandidato: c.sqCandidato,
    };
    // só faz sentido um candidato escolhido por cargo: troca o anterior
    const atualizada = ordenarPorCargo([...candidatos.filter((x) => x.cargo !== cargo), novo]);
    setCandidatos(atualizada);
    salvarCandidatos(atualizada);
  }

  function remover(id: string) {
    const atualizada = candidatos.filter((c) => c.id !== id);
    setCandidatos(atualizada);
    salvarCandidatos(atualizada);
  }

  async function imprimir() {
    setEnviando("imprimir");
    try {
      await imprimirCola(candidatos);
    } finally {
      setEnviando(null);
    }
  }

  async function compartilhar() {
    setEnviando("compartilhar");
    try {
      await compartilharCola(candidatos);
    } finally {
      setEnviando(null);
    }
  }

  return (
    <LinearGradient
      colors={fundo as [string, string]}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <StatusBar style="light" />
      <Text style={styles.titulo}>Minha Cola 2026</Text>
      <Text style={styles.subtitulo}>
        Filtre por partido, número ou nome oficial (dados do TSE) e monte sua
        cola antes de votar.
      </Text>

      {candidatos.length > 0 && (
        <View style={styles.minhaCola}>
          {candidatos.map((c) => (
            <View key={c.id} style={styles.item}>
              {c.sqCandidato ? (
                <Image source={{ uri: fotoUrl(c.uf, c.sqCandidato) }} style={styles.foto} />
              ) : (
                <View style={styles.fotoVazia} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemCargo}>{capitalizar(c.cargo)}</Text>
                <Text style={styles.itemNome}>
                  {c.nome}
                  {c.partido ? ` (${c.partido})` : ""}
                </Text>
              </View>
              <Text style={styles.itemNumero}>{c.numero}</Text>
              <TouchableOpacity onPress={() => remover(c.id)} style={styles.remover}>
                <Text style={styles.removerTexto}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.acoes}>
        <TouchableOpacity style={styles.botaoAcao} onPress={imprimir} disabled={enviando !== null}>
          {enviando === "imprimir" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoAcaoTexto}>Imprimir</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoAcao} onPress={compartilhar} disabled={enviando !== null}>
          {enviando === "compartilhar" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoAcaoTexto}>Compartilhar</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filtros}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cargos}
          data={CARGOS}
          keyExtractor={(c) => c}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={[styles.cargoBotao, cargo === c && styles.cargoBotaoAtivo]}
              onPress={() => {
                setCargo(c);
                limparFiltros();
              }}
            >
              <Text style={[styles.cargoTexto, cargo === c && styles.cargoTextoAtivo]}>
                {capitalizar(c)}
              </Text>
            </TouchableOpacity>
          )}
        />

        {cargo !== "PRESIDENTE" && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cargos}
            data={UFS}
            keyExtractor={(u) => u}
            renderItem={({ item: u }) => (
              <TouchableOpacity
                style={[styles.ufBotao, uf === u && styles.cargoBotaoAtivo]}
                onPress={() => {
                  setUf(u);
                  limparFiltros();
                }}
              >
                <Text style={[styles.cargoTexto, uf === u && styles.cargoTextoAtivo]}>{u}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cargos}
          data={["", ...partidos]}
          keyExtractor={(p) => p || "todos"}
          renderItem={({ item: p }) => (
            <TouchableOpacity
              style={[styles.ufBotao, filtroPartido === p && styles.cargoBotaoAtivo]}
              onPress={() => setFiltroPartido(p)}
            >
              <Text style={[styles.cargoTexto, filtroPartido === p && styles.cargoTextoAtivo]}>
                {p || "Todos os partidos"}
              </Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.linha}>
          <TextInput
            style={[styles.input, styles.inputNumero]}
            placeholder="Número"
            placeholderTextColor="#8a9bb8"
            value={filtroNumero}
            onChangeText={setFiltroNumero}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, styles.inputPartido]}
            placeholder="Nome do candidato"
            placeholderTextColor="#8a9bb8"
            value={filtroNome}
            onChangeText={setFiltroNome}
          />
        </View>
      </View>

      <FlatList
        style={styles.resultados}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        data={resultados}
        keyExtractor={(c) => c.sqCandidato}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum candidato encontrado com esses filtros.</Text>
        }
        renderItem={({ item: c }) => (
          <TouchableOpacity style={styles.item} onPress={() => adicionar(c)}>
            <Image source={{ uri: fotoUrl(ufAtual, c.sqCandidato) }} style={styles.foto} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemNome}>{capitalizar(c.nomeUrna)}</Text>
              <Text style={styles.itemCargo}>{c.partido}</Text>
            </View>
            <Text style={styles.itemNumero}>{c.numero}</Text>
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 13,
    color: "#a9b8d4",
    textAlign: "center",
    marginTop: 4,
    marginHorizontal: 24,
  },
  minhaCola: { paddingHorizontal: 16, paddingTop: 16 },
  vazio: { color: "#8a9bb8", textAlign: "center", marginTop: 24, paddingHorizontal: 16 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#132a52",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  foto: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#0e2244" },
  fotoVazia: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2a3f6b" },
  itemInfo: { flex: 1, marginLeft: 10 },
  itemCargo: { color: "#7fa8f7", fontSize: 12, fontWeight: "600" },
  itemNome: { color: "#fff", fontSize: 16, marginTop: 2 },
  itemNumero: {
    color: "#ffd75e",
    fontSize: 28,
    fontWeight: "800",
    marginHorizontal: 12,
  },
  remover: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2a3f6b",
    alignItems: "center",
    justifyContent: "center",
  },
  removerTexto: { color: "#fff", fontSize: 18, lineHeight: 18 },
  acoes: { flexDirection: "row", gap: 10, marginTop: 4, paddingHorizontal: 16 },
  botaoAcao: {
    flex: 1,
    backgroundColor: "#132a52",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoAcaoTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  filtros: {
    borderTopWidth: 1,
    borderTopColor: "#1e3560",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: 16,
  },
  resultados: { flex: 1, paddingHorizontal: 16 },
  cargos: { marginBottom: 10 },
  cargoBotao: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#132a52",
    marginRight: 8,
  },
  ufBotao: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#132a52",
    marginRight: 6,
  },
  cargoBotaoAtivo: { backgroundColor: "#3467e0" },
  cargoTexto: { color: "#a9b8d4", fontSize: 13 },
  cargoTextoAtivo: { color: "#fff", fontWeight: "700" },
  input: {
    backgroundColor: "#132a52",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 15,
  },
  linha: { flexDirection: "row", gap: 8 },
  inputNumero: { flex: 1 },
  inputPartido: { flex: 2 },
});
