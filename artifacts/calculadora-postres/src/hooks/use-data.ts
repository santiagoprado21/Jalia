import { useLocalStorage } from "./use-local-storage";
import type { Ingrediente, Receta, CalcReceta, Cotizacion, VentaDiaria } from "@/types";

export function useIngredientes() {
  const [ingredientes, setIngredientes] = useLocalStorage<Ingrediente[]>("postres_ingredientes", []);

  function agregarIngrediente(data: Omit<Ingrediente, "id" | "costoPorUnidad">) {
    const nuevo: Ingrediente = {
      ...data,
      id: crypto.randomUUID(),
      costoPorUnidad: data.cantidadTotal > 0 ? data.costoTotal / data.cantidadTotal : 0,
    };
    setIngredientes((prev) => [...prev, nuevo]);
    return nuevo;
  }

  function actualizarIngrediente(id: string, data: Omit<Ingrediente, "id" | "costoPorUnidad">) {
    setIngredientes((prev) =>
      prev.map((ing) =>
        ing.id === id
          ? { ...ing, ...data, costoPorUnidad: data.cantidadTotal > 0 ? data.costoTotal / data.cantidadTotal : 0 }
          : ing
      )
    );
  }

  function eliminarIngrediente(id: string) {
    setIngredientes((prev) => prev.filter((ing) => ing.id !== id));
  }

  return { ingredientes, agregarIngrediente, actualizarIngrediente, eliminarIngrediente };
}

export function useRecetas() {
  const [recetas, setRecetas] = useLocalStorage<Receta[]>("postres_recetas", []);

  function agregarReceta(data: Omit<Receta, "id" | "fechaCreacion">) {
    const nueva: Receta = {
      ...data,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString(),
    };
    setRecetas((prev) => [...prev, nueva]);
    return nueva;
  }

  function actualizarReceta(id: string, data: Partial<Omit<Receta, "id" | "fechaCreacion">>) {
    setRecetas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
  }

  function eliminarReceta(id: string) {
    setRecetas((prev) => prev.filter((r) => r.id !== id));
  }

  function getReceta(id: string) {
    return recetas.find((r) => r.id === id);
  }

  return { recetas, agregarReceta, actualizarReceta, eliminarReceta, getReceta };
}

export function useCotizaciones() {
  const [cotizaciones, setCotizaciones] = useLocalStorage<Cotizacion[]>("postres_cotizaciones", []);

  function agregarCotizacion(data: Omit<Cotizacion, "id" | "fechaCreacion">) {
    const nueva: Cotizacion = {
      ...data,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString(),
    };
    setCotizaciones((prev) => [...prev, nueva]);
    return nueva;
  }

  function actualizarCotizacion(id: string, data: Partial<Omit<Cotizacion, "id" | "fechaCreacion">>) {
    setCotizaciones((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }

  function cambiarEstado(id: string, estado: Cotizacion["estado"]) {
    setCotizaciones((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
  }

  function eliminarCotizacion(id: string) {
    setCotizaciones((prev) => prev.filter((c) => c.id !== id));
  }

  function getCotizacion(id: string) {
    return cotizaciones.find((c) => c.id === id);
  }

  return { cotizaciones, agregarCotizacion, actualizarCotizacion, cambiarEstado, eliminarCotizacion, getCotizacion };
}

export function useVentas() {
  const [ventas, setVentas] = useLocalStorage<VentaDiaria[]>("postres_ventas", []);

  function guardarVenta(data: Omit<VentaDiaria, "id">) {
    const existente = ventas.find((v) => v.fecha === data.fecha);
    if (existente) {
      setVentas((prev) => prev.map((v) => v.fecha === data.fecha ? { ...v, ...data } : v));
      return existente;
    }
    const nueva: VentaDiaria = { ...data, id: crypto.randomUUID() };
    setVentas((prev) => [...prev, nueva]);
    return nueva;
  }

  function eliminarVenta(fecha: string) {
    setVentas((prev) => prev.filter((v) => v.fecha !== fecha));
  }

  function getVentaPorFecha(fecha: string) {
    return ventas.find((v) => v.fecha === fecha);
  }

  function getVentasSemana(inicioSemana: string) {
    const inicio = new Date(inicioSemana + "T00:00:00");
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    return ventas.filter((v) => {
      const d = new Date(v.fecha + "T00:00:00");
      return d >= inicio && d <= fin;
    });
  }

  return { ventas, guardarVenta, eliminarVenta, getVentaPorFecha, getVentasSemana };
}

export function calcularPrecio(receta: Receta, ingredientes: Ingrediente[]): CalcReceta {
  const costoIngredientes = receta.ingredientesReceta.reduce((sum, ir) => {
    const ing = ingredientes.find((i) => i.id === ir.ingredienteId);
    if (!ing) return sum;
    return sum + ing.costoPorUnidad * ir.cantidad;
  }, 0);

  const costoTotal = costoIngredientes + receta.costosFijos;
  const costoPorPorcion = receta.porciones > 0 ? costoTotal / receta.porciones : 0;
  const precioVentaSugerido = costoPorPorcion * (1 + receta.margenGanancia / 100);
  const gananciaTotal = (precioVentaSugerido - costoPorPorcion) * receta.porciones;

  return { costoIngredientes, costoTotal, costoPorPorcion, precioVentaSugerido, gananciaTotal };
}
