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
  costosVariables?: number;
  margenGanancia: number;
  margenMayorista?: number;
  fechaCreacion: string;
  variantes?: VarianteReceta[];
}

export interface CalcReceta {
  costoIngredientes: number;
  costosFijos: number;
  costosVariables: number;
  costoTotal: number;
  costoPorPorcion: number;
  precioVentaSugerido: number;
  gananciaTotal: number;
  precioMayorista?: number;
  gananciaMayorista?: number;
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
  porcionesVariante?: number;
  ingredientesExtra: IngredienteReceta[];
}

export type FormaPago = "efectivo" | "nequi" | "llave";

export const FORMAS_PAGO: { value: FormaPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "llave", label: "Llave" },
];

export interface ItemVenta {
  recetaId: string;
  cantidad: number;
  precioVenta: number;
  formaPago?: FormaPago;
}

export interface VentaDiaria {
  id: string;
  fecha: string;
  items: ItemVenta[];
  notas?: string;
}

export interface ItemListaCompra {
  id: string;
  ingredienteId?: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  comprado: boolean;
  notas?: string;
}

export interface PagoConsignacion {
  id: string;
  fecha: string;
  monto: number;
  formaPago: FormaPago;
  notas?: string;
}

export interface Consignacion {
  id: string;
  clienteNombre: string;
  telefono?: string;
  recetaId: string;
  cantidadEntregada: number;
  cantidadVendida: number;
  precioUnitario: number;
  fechaEntrega: string;
  estado: "activa" | "parcial" | "liquidada";
  notas?: string;
  pagos: PagoConsignacion[];
}

export const ESTADOS_CONSIGNACION: { value: Consignacion["estado"]; label: string; color: string }[] = [
  { value: "activa", label: "Activa", color: "bg-blue-100 text-blue-700" },
  { value: "parcial", label: "Parcial", color: "bg-yellow-100 text-yellow-700" },
  { value: "liquidada", label: "Liquidada", color: "bg-green-100 text-green-700" },
];

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
