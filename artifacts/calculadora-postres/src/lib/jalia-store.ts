import type {
  Consignacion,
  Cotizacion,
  Ingrediente,
  ItemListaCompra,
  Receta,
  VentaDiaria,
} from "@/types";

export const STORAGE_KEYS = {
  ingredientes: "postres_ingredientes",
  recetas: "postres_recetas",
  cotizaciones: "postres_cotizaciones",
  ventas: "postres_ventas",
  listaCompras: "postres_lista_compras",
  consignaciones: "postres_consignaciones",
} as const;

export interface JaliaDatos {
  ingredientes: Ingrediente[];
  recetas: Receta[];
  cotizaciones: Cotizacion[];
  ventas: VentaDiaria[];
  listaCompras: ItemListaCompra[];
  consignaciones: Consignacion[];
}

export const EMPTY_DATOS: JaliaDatos = {
  ingredientes: [],
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
    recetas: read<Receta>(STORAGE_KEYS.recetas),
    cotizaciones: read<Cotizacion>(STORAGE_KEYS.cotizaciones),
    ventas: read<VentaDiaria>(STORAGE_KEYS.ventas),
    listaCompras: read<ItemListaCompra>(STORAGE_KEYS.listaCompras),
    consignaciones: read<Consignacion>(STORAGE_KEYS.consignaciones),
  };
}

export function writeLocalDatos(datos: JaliaDatos) {
  localStorage.setItem(STORAGE_KEYS.ingredientes, JSON.stringify(datos.ingredientes));
  localStorage.setItem(STORAGE_KEYS.recetas, JSON.stringify(datos.recetas));
  localStorage.setItem(STORAGE_KEYS.cotizaciones, JSON.stringify(datos.cotizaciones));
  localStorage.setItem(STORAGE_KEYS.ventas, JSON.stringify(datos.ventas));
  localStorage.setItem(STORAGE_KEYS.listaCompras, JSON.stringify(datos.listaCompras));
  localStorage.setItem(STORAGE_KEYS.consignaciones, JSON.stringify(datos.consignaciones));
}

export function countLocalRecords() {
  const datos = readLocalDatos();
  return (
    datos.ingredientes.length +
    datos.recetas.length +
    datos.cotizaciones.length +
    datos.ventas.length +
    datos.listaCompras.length +
    datos.consignaciones.length
  );
}

export function isCloudEmpty(datos: JaliaDatos) {
  return Object.values(datos).every((arr) => arr.length === 0);
}

export function rowToDatos(row: Record<string, unknown>): JaliaDatos {
  const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

  return {
    ingredientes: asArray<Ingrediente>(row.ingredientes),
    recetas: asArray<Receta>(row.recetas),
    cotizaciones: asArray<Cotizacion>(row.cotizaciones),
    ventas: asArray<VentaDiaria>(row.ventas),
    listaCompras: asArray<ItemListaCompra>(row.lista_compras),
    consignaciones: asArray<Consignacion>(row.consignaciones),
  };
}

export function datosToRow(userId: string, datos: JaliaDatos) {
  return {
    user_id: userId,
    ingredientes: datos.ingredientes,
    recetas: datos.recetas,
    cotizaciones: datos.cotizaciones,
    ventas: datos.ventas,
    lista_compras: datos.listaCompras,
    consignaciones: datos.consignaciones,
    updated_at: new Date().toISOString(),
  };
}
