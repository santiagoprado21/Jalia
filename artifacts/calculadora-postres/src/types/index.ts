export interface Ingrediente {
  id: string;
  nombre: string;
  unidad: "kg" | "g" | "l" | "ml" | "pza" | "taza";
  costoTotal: number;
  cantidadTotal: number;
  costoPorUnidad: number;
}

export interface IngredienteReceta {
  ingredienteId: string;
  cantidad: number;
}

export interface Receta {
  id: string;
  nombre: string;
  categoria: string;
  porciones: number;
  ingredientesReceta: IngredienteReceta[];
  costosFijos: number;
  margenGanancia: number;
  fechaCreacion: string;
  variantes?: VarianteReceta[];
}

export interface CalcReceta {
  costoIngredientes: number;
  costoTotal: number;
  costoPorPorcion: number;
  precioVentaSugerido: number;
  gananciaTotal: number;
}

export interface ItemCotizacion {
  recetaId: string;
  cantidad: number;
}

export interface Cotizacion {
  id: string;
  nombreCliente: string;
  telefono?: string;
  fechaEntrega?: string;
  notas?: string;
  items: ItemCotizacion[];
  estado: "pendiente" | "confirmado" | "entregado";
  fechaCreacion: string;
}

export const ESTADOS_COTIZACION: { value: Cotizacion["estado"]; label: string; color: string }[] = [
  { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  { value: "confirmado", label: "Confirmado", color: "bg-green-100 text-green-700" },
  { value: "entregado", label: "Entregado", color: "bg-blue-100 text-blue-700" },
];

export interface VarianteReceta {
  id: string;
  nombre: string;
  ingredientesExtra: IngredienteReceta[];
}

export interface ItemVenta {
  recetaId: string;
  cantidad: number;
  precioVenta: number;
}

export interface VentaDiaria {
  id: string;
  fecha: string;
  items: ItemVenta[];
  notas?: string;
}

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const CATEGORIAS = [
  "Pasteles",
  "Cupcakes",
  "Galletas",
  "Flanes",
  "Trufas",
  "Pays",
  "Brownies",
  "Cheesecakes",
  "Otro",
] as const;

export const UNIDADES: { value: Ingrediente["unidad"]; label: string }[] = [
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "l", label: "Litros (l)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "pza", label: "Pieza (pza)" },
  { value: "taza", label: "Taza" },
];
