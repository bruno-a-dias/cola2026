import { useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
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
import { StatusBar } from "expo-status-bar";
import dadosJson from "./assets/candidatos.json";
import {
  buscarCandidatos,
  CandidatoTSE,
  capitalizar,
  CARGOS,
  Cargo,
  Candidato,
  DIGITOS_POR_CARGO,
  fotoUrl,
  ordenarPorCargo,
  UFS,
  Uf,
} from "./lib";
import { carregarCandidatos, salvarCandidatos } from "./storage";
import { compartilharCola, imprimirCola } from "./sheet";

const dados = dadosJson as unknown as { geradoEm: string; porUf: Record<string, CandidatoTSE[]> };

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
  const [termo, setTermo] = useState("");
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [partido, setPartido] = useState("");
  const [sqCandidato, setSqCandidato] = useState<string | undefined>();
  const [enviando, setEnviando] = useState<"imprimir" | "compartilhar" | null>(null);

  useEffect(() => {
    carregarCandidatos().then(setCandidatos);
  }, []);

  const ufAtual = cargo === "PRESIDENTE" ? "BR" : uf;

  const sugestoes = useMemo(
    () => buscarCandidatos(dados.porUf, cargo, ufAtual, termo),
    [cargo, ufAtual, termo]
  );

  function selecionar(c: CandidatoTSE) {
    setNome(capitalizar(c.nomeUrna));
    setNumero(c.numero);
    setPartido(c.partido);
    setSqCandidato(c.sqCandidato);
    setTermo("");
  }

  function adicionar() {
    if (!nome.trim() || !numero.trim()) return;
    const novo: Candidato = {
      id: String(Date.now()),
      cargo,
      nome: nome.trim(),
      numero: numero.trim(),
      partido: partido.trim(),
      uf: ufAtual,
      sqCandidato,
    };
    const atualizada = ordenarPorCargo([...candidatos, novo]);
    setCandidatos(atualizada);
    salvarCandidatos(atualizada);
    setNome("");
    setNumero("");
    setPartido("");
    setSqCandidato(undefined);
    setTermo("");
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
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <StatusBar style="light" />
      <Text style={styles.titulo}>Minha Cola 2026</Text>
      <Text style={styles.subtitulo}>
        Busque pelo número ou nome oficial (dados do TSE) e monte sua cola
        antes de votar.
      </Text>

      <ScrollView contentContainerStyle={styles.lista}>
        {candidatos.length === 0 && (
          <Text style={styles.vazio}>Nenhum candidato salvo ainda.</Text>
        )}
        {candidatos.map((c) => (
          <View key={c.id} style={styles.item}>
            {c.sqCandidato ? (
              <Image
                source={{ uri: fotoUrl(c.uf, c.sqCandidato) }}
                style={styles.foto}
              />
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

        {candidatos.length > 0 && (
          <View style={styles.acoes}>
            <TouchableOpacity
              style={styles.botaoAcao}
              onPress={imprimir}
              disabled={enviando !== null}
            >
              {enviando === "imprimir" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botaoAcaoTexto}>Imprimir</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botaoAcao}
              onPress={compartilhar}
              disabled={enviando !== null}
            >
              {enviando === "compartilhar" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botaoAcaoTexto}>Compartilhar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.form, { paddingBottom: insets.bottom + 20 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cargos}>
          {CARGOS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.cargoBotao, cargo === c && styles.cargoBotaoAtivo]}
              onPress={() => {
                setCargo(c);
                setTermo("");
              }}
            >
              <Text style={[styles.cargoTexto, cargo === c && styles.cargoTextoAtivo]}>
                {capitalizar(c)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {cargo !== "PRESIDENTE" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cargos}>
            {UFS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.ufBotao, uf === u && styles.cargoBotaoAtivo]}
                onPress={() => {
                  setUf(u);
                  setTermo("");
                }}
              >
                <Text style={[styles.cargoTexto, uf === u && styles.cargoTextoAtivo]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TextInput
          style={styles.input}
          placeholder="Buscar candidato oficial por número ou nome"
          placeholderTextColor="#8a9bb8"
          value={termo}
          onChangeText={setTermo}
        />
        {sugestoes.length > 0 && (
          <View style={styles.sugestoes}>
            {sugestoes.map((s) => (
              <TouchableOpacity
                key={s.sqCandidato}
                style={styles.sugestao}
                onPress={() => selecionar(s)}
              >
                <Image source={{ uri: fotoUrl(ufAtual, s.sqCandidato) }} style={styles.foto} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNome}>{capitalizar(s.nomeUrna)}</Text>
                  <Text style={styles.itemCargo}>{s.partido}</Text>
                </View>
                <Text style={styles.itemNumero}>{s.numero}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Nome do candidato"
          placeholderTextColor="#8a9bb8"
          value={nome}
          onChangeText={(t) => {
            setNome(t);
            setSqCandidato(undefined);
          }}
        />
        <View style={styles.linha}>
          <TextInput
            style={[styles.input, styles.inputNumero]}
            placeholder="Número"
            placeholderTextColor="#8a9bb8"
            value={numero}
            onChangeText={(t) => {
              setNumero(t);
              setSqCandidato(undefined);
            }}
            keyboardType="number-pad"
            maxLength={DIGITOS_POR_CARGO[cargo]}
          />
          <TextInput
            style={[styles.input, styles.inputPartido]}
            placeholder="Partido (opcional)"
            placeholderTextColor="#8a9bb8"
            value={partido}
            onChangeText={setPartido}
          />
        </View>
        <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionar}>
          <Text style={styles.botaoAdicionarTexto}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1d3a" },
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
  lista: { padding: 16, paddingBottom: 8 },
  vazio: { color: "#8a9bb8", textAlign: "center", marginTop: 24 },
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
  acoes: { flexDirection: "row", gap: 10, marginTop: 4 },
  botaoAcao: {
    flex: 1,
    backgroundColor: "#132a52",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoAcaoTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  form: {
    borderTopWidth: 1,
    borderTopColor: "#1e3560",
    padding: 16,
    backgroundColor: "#0e2244",
  },
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
  sugestoes: {
    backgroundColor: "#132a52",
    borderRadius: 10,
    marginTop: -4,
    marginBottom: 8,
    overflow: "hidden",
  },
  sugestao: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#0e2244",
  },
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
  botaoAdicionar: {
    backgroundColor: "#3467e0",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  botaoAdicionarTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
