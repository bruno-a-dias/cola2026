import AsyncStorage from "@react-native-async-storage/async-storage";
import { Candidato } from "./lib";

const KEY = "cola2026:candidatos";

export async function carregarCandidatos(): Promise<Candidato[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function salvarCandidatos(lista: Candidato[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(lista));
}
