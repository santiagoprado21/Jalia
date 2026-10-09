import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Consignacion,
  Cotizacion,
  Empaque,
  Ingrediente,
  ItemListaCompra,
  Receta,
  VentaDiaria,
} from "@/types";

export const STORAGE_KEYS = {
  ingredientes: "postres_ingredientes",
  empaques: "postres_empaques",
  recetas: "postres_recetas",
  cotizaciones: "postres_cotizaciones",
  ventas: "postres_ventas",
  listaCompras: "postres_lista_compras",
  consignaciones: "postres_consignaciones",
} as const;

export interface JaliaDatos {
  ingredientes: Ingrediente[];
  empaques: Empaque[];
  recetas: Receta[];
  cotizaciones: Cotizacion[];
  ventas: VentaDiaria[];
  listaCompras: ItemListaCompra[];
  consignaciones: Consignacion[];
}

export const EMPTY_DATOS: JaliaDatos = {
  ingredientes: [],
  empaques: [],
  recetas: [],
  cotizaciones: [],
  ventas: [],
  listaCompras: [],
  consignaciones: [],
};

export function readLocalDatos(): JaliaDatos {
  const read = <T,>(key: string): T[] => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return {
    ingredientes: read<Ingrediente>(STORAGE_KEYS.ingredientes),
    empaques: read<Empaque>(STORAGE_KEYS.empaques),
    recetas: read<Receta>(STORAGE_KEYS.recetas),
    cotizaciones: read<Cotizacion>(STORAGE_KEYS.cotizaciones),
    ventas: read<VentaDiaria>(STORAGE_KEYS.ventas),
    listaCompras: read<ItemListaCompra>(STORAGE_KEYS.listaCompras),
    consignaciones: read<Consignacion>(STORAGE_KEYS.consignaciones),
  };
}

export function writeLocalDatos(datos: JaliaDatos) {
  localStorage.setItem(STORAGE_KEYS.ingredientes, JSON.stringify(datos.ingredientes));
  localStorage.setItem(STORAGE_KEYS.empaques, JSON.stringify(datos.empaques));
  localStorage.setItem(STORAGE_KEYS.recetas, JSON.stringify(datos.recetas));
  localStorage.setItem(STORAGE_KEYS.cotizaciones, JSON.stringify(datos.cotizaciones));
  localStorage.setItem(STORAGE_KEYS.ventas, JSON.stringify(datos.ventas));
  localStorage.setItem(STORAGE_KEYS.listaCompras, JSON.stringify(datos.listaCompras));
  localStorage.setItem(STORAGE_KEYS.consignaciones, JSON.stringify(datos.consignaciones));
}

export function countLocalRecords() {
  const datos = readLocalDatos();
  return Object.values(datos).reduce((sum, arr) => sum + arr.length, 0);
}

const PENDIENTE_KEY = "jalia_sync_pendiente";
const MERGE_INICIAL_KEY = "jalia_sync_merge_inicial";
const DUENO_LOCAL_KEY = "jalia_local_dueno";

export function marcarSyncPendiente(userId: string) {
  localStorage.setItem(PENDIENTE_KEY, userId);
  localStorage.setItem(DUENO_LOCAL_KEY, userId);
}

/** Devuelve true si hay que mezclar la copia local con la nube en vez de sobrescribirla. */
export function tieneSyncPendiente(userId: string) {
  const dueno = localStorage.getItem(DUENO_LOCAL_KEY);
  if (dueno && dueno !== userId) return false;
  return (
    localStorage.getItem(PENDIENTE_KEY) === userId ||
    localStorage.getItem(MERGE_INICIAL_KEY) !== userId
  );
}

export function limpiarSyncPendiente(userId: string) {
  localStorage.removeItem(PENDIENTE_KEY);
  localStorage.setItem(MERGE_INICIAL_KEY, userId);
  localStorage.setItem(DUENO_LOCAL_KEY, userId);
}

function mergePorId<T extends { id: string }>(base: T[], encima: T[]): T[] {
  const porId = new Map(base.map((item) => [item.id, item]));
  encima.forEach((item) => porId.set(item.id, item));
  return Array.from(porId.values());
}

/** Combina dos copias; si un registro existe en ambas, gana el de `encima`. */
export function mergeDatos(base: JaliaDatos, encima: JaliaDatos): JaliaDatos {
  return {
    ingredientes: mergePorId(base.ingredientes, encima.ingredientes),
    empaques: mergePorId(base.empaques, encima.empaques),
    recetas: mergePorId(base.recetas, encima.recetas),
    cotizaciones: mergePorId(base.cotizaciones, encima.cotizaciones),
    ventas: mergePorId(base.ventas, encima.ventas),
    listaCompras: mergePorId(base.listaCompras, encima.listaCompras),
    consignaciones: mergePorId(base.consignaciones, encima.consignaciones),
  };
}

export function isCloudEmpty(datos: JaliaDatos) {
  return Object.values(datos).every((arr) => arr.length === 0);
}

/**
 * `empaquesLocales` se usa cuando la tabla todavía no tiene la columna `empaques`,
 * para no borrar los empaques guardados en el dispositivo.
 */
export function rowToDatos(row: Record<string, unknown>, empaquesLocales: Empaque[] = []): JaliaDatos {
  const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

  return {
    ingredientes: asArray<Ingrediente>(row.ingredientes),
    empaques: "empaques" in row ? asArray<Empaque>(row.empaques) : empaquesLocales,
    recetas: asArray<Receta>(row.recetas),
    cotizaciones: asArray<Cotizacion>(row.cotizaciones),
    ventas: asArray<VentaDiaria>(row.ventas),
    listaCompras: asArray<ItemListaCompra>(row.lista_compras),
    consignaciones: asArray<Consignacion>(row.consignaciones),
  };
}

export function datosToRow(userId: string, datos: JaliaDatos): Record<string, unknown> {
  return {
    user_id: userId,
    ingredientes: datos.ingredientes,
    empaques: datos.empaques,
    recetas: datos.recetas,
    cotizaciones: datos.cotizaciones,
    ventas: datos.ventas,
    lista_compras: datos.listaCompras,
    consignaciones: datos.consignaciones,
    updated_at: new Date().toISOString(),
  };
}

let tablaTieneEmpaques = true;

/** Guarda en Supabase; si la columna `empaques` aún no existe, guarda el resto. */
export async function guardarEnNube(supabase: SupabaseClient, userId: string, datos: JaliaDatos) {
  const row = datosToRow(userId, datos);
  if (!tablaTieneEmpaques) delete row.empaques;
  let { error } = await supabase.from("jalia_datos").upsert(row);
  if (error && tablaTieneEmpaques && error.message.includes("empaques")) {
    console.warn("La tabla jalia_datos no tiene la columna empaques; ejecuta supabase/schema.sql.");
    tablaTieneEmpaques = false;
    delete row.empaques;
    ({ error } = await supabase.from("jalia_datos").upsert(row));
  }
  return { error };
}
