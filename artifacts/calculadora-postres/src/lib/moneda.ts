export const LOCALE = "es-CO";

/** Redondea al peso entero para que lista y desglose coincidan. */
export function redondearPrecio(value: number): number {
  return Math.round(value);
}

export function formatMoneda(value: number): string {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "COP" }).format(redondearPrecio(value));
}
