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
}

export interface CalcReceta {
  costoIngredientes: number;
  costoTotal: number;
  costoPorPorcion: number;
  precioVentaSugerido: number;
  gananciaTotal: number;
}

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
