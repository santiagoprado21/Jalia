import { useLocalStorage } from "./use-local-storage";
import type {
  Ingrediente,
  Receta,
  CalcReceta,
  Cotizacion,
  VentaDiaria,
  ItemListaCompra,
  Consignacion,
  FormaPago,
} from "@/types";
import { redondearPrecio } from "@/lib/moneda";

function costosReceta(receta: Receta) {
  return {
    costosFijos: receta.costosFijos ?? 0,
    costosVariables: receta.costosVariables ?? 0,
  };
}

function construirCalc(
  costoIngredientes: number,
  costosFijos: number,
  costosVariables: number,
  porciones: number,
  margenGanancia: number,
  margenMayorista?: number
): CalcReceta {
  const costoTotal = costoIngredientes + costosFijos + costosVariables;
  const porcionesSafe = porciones > 0 ? porciones : 1;
  const costoPorPorcion = redondearPrecio(costoTotal / porcionesSafe);
  const precioVentaSugerido = redondearPrecio(costoPorPorcion * (1 + margenGanancia / 100));
  const gananciaTotal = redondearPrecio((precioVentaSugerido - costoPorPorcion) * porcionesSafe);

  const precioMayorista =
    margenMayorista !== undefined && margenMayorista > 0
      ? redondearPrecio(costoPorPorcion * (1 + margenMayorista / 100))
      : undefined;
  const gananciaMayorista =
    precioMayorista !== undefined
      ? redondearPrecio((precioMayorista - costoPorPorcion) * porcionesSafe)
      : undefined;

  return {
    costoIngredientes: redondearPrecio(costoIngredientes),
    costosFijos: redondearPrecio(costosFijos),
    costosVariables: redondearPrecio(costosVariables),
    costoTotal: redondearPrecio(costoTotal),
    costoPorPorcion,
    precioVentaSugerido,
    gananciaTotal,
    precioMayorista,
    gananciaMayorista,
  };
}

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
      setVentas((prev) => prev.map((v) => (v.fecha === data.fecha ? { ...v, ...data } : v)));
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

  function getVentasMes(anio: number, mes: number) {
    return ventas.filter((v) => {
      const d = new Date(v.fecha + "T12:00:00");
      return d.getFullYear() === anio && d.getMonth() === mes;
    });
  }

  return { ventas, guardarVenta, eliminarVenta, getVentaPorFecha, getVentasSemana, getVentasMes };
}

export function useListaCompras() {
  const [items, setItems] = useLocalStorage<ItemListaCompra[]>("postres_lista_compras", []);

  function agregarItem(data: Omit<ItemListaCompra, "id" | "comprado">) {
    const nuevo: ItemListaCompra = { ...data, id: crypto.randomUUID(), comprado: false };
    setItems((prev) => [...prev, nuevo]);
    return nuevo;
  }

  function actualizarItem(id: string, data: Partial<Omit<ItemListaCompra, "id">>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  }

  function toggleComprado(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, comprado: !i.comprado } : i)));
  }

  function eliminarItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function limpiarComprados() {
    setItems((prev) => prev.filter((i) => !i.comprado));
  }

  function reemplazarItems(nuevos: ItemListaCompra[]) {
    setItems(nuevos);
  }

  return { items, agregarItem, actualizarItem, toggleComprado, eliminarItem, limpiarComprados, reemplazarItems };
}

export function useConsignaciones() {
  const [consignaciones, setConsignaciones] = useLocalStorage<Consignacion[]>("postres_consignaciones", []);

  function agregarConsignacion(data: Omit<Consignacion, "id" | "pagos" | "estado"> & { estado?: Consignacion["estado"] }) {
    const nueva: Consignacion = {
      ...data,
      id: crypto.randomUUID(),
      pagos: [],
      estado: data.estado ?? "activa",
    };
    setConsignaciones((prev) => [...prev, nueva]);
    return nueva;
  }

  function actualizarConsignacion(id: string, data: Partial<Omit<Consignacion, "id">>) {
    setConsignaciones((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }

  function registrarVentaConsignacion(id: string, cantidadVendida: number) {
    setConsignaciones((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const vendidas = Math.min(c.cantidadEntregada, cantidadVendida);
        const estado = vendidas >= c.cantidadEntregada ? "liquidada" : vendidas > 0 ? "parcial" : "activa";
        return { ...c, cantidadVendida: vendidas, estado };
      })
    );
  }

  function registrarPago(id: string, monto: number, formaPago: FormaPago, notas?: string) {
    setConsignaciones((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const pagos = [
          ...c.pagos,
          { id: crypto.randomUUID(), fecha: new Date().toISOString().slice(0, 10), monto, formaPago, notas },
        ];
        const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
        const totalEsperado = c.cantidadVendida * c.precioUnitario;
        const estado = totalPagado >= totalEsperado && c.cantidadVendida >= c.cantidadEntregada
          ? "liquidada"
          : totalPagado > 0 || c.cantidadVendida > 0
          ? "parcial"
          : "activa";
        return { ...c, pagos, estado };
      })
    );
  }

  function eliminarConsignacion(id: string) {
    setConsignaciones((prev) => prev.filter((c) => c.id !== id));
  }

  function getConsignacion(id: string) {
    return consignaciones.find((c) => c.id === id);
  }

  return {
    consignaciones,
    agregarConsignacion,
    actualizarConsignacion,
    registrarVentaConsignacion,
    registrarPago,
    eliminarConsignacion,
    getConsignacion,
  };
}

export function calcularPrecioVariante(
  receta: Receta,
  ingredientesExtra: import("@/types").IngredienteReceta[],
  porcionesVariante: number | undefined,
  ingredientes: Ingrediente[]
): CalcReceta {
  const basePorciones = receta.porciones > 0 ? receta.porciones : 1;
  const extraPorciones = porcionesVariante && porcionesVariante > 0 ? porcionesVariante : basePorciones;
  const { costosFijos, costosVariables } = costosReceta(receta);

  const baseCostoIng = receta.ingredientesReceta.reduce((sum, ir) => {
    const ing = ingredientes.find((i) => i.id === ir.ingredienteId);
    return sum + (ing ? ing.costoPorUnidad * ir.cantidad : 0);
  }, 0);

  const extraCostoIng = ingredientesExtra.reduce((sum, ir) => {
    const ing = ingredientes.find((i) => i.id === ir.ingredienteId);
    return sum + (ing ? ing.costoPorUnidad * ir.cantidad : 0);
  }, 0);

  const baseCostoPorPorcion = baseCostoIng / basePorciones;
  const extraCostoPorPorcion = extraCostoIng / extraPorciones;
  const totalIngPorPorcion = baseCostoPorPorcion + extraCostoPorPorcion;
  const costoIngredientes = totalIngPorPorcion * basePorciones;

  return construirCalc(
    costoIngredientes,
    costosFijos,
    costosVariables,
    basePorciones,
    receta.margenGanancia,
    receta.margenMayorista
  );
}

export function calcularPrecio(receta: Receta, ingredientes: Ingrediente[]): CalcReceta {
  const { costosFijos, costosVariables } = costosReceta(receta);
  const costoIngredientes = receta.ingredientesReceta.reduce((sum, ir) => {
    const ing = ingredientes.find((i) => i.id === ir.ingredienteId);
    if (!ing) return sum;
    return sum + ing.costoPorUnidad * ir.cantidad;
  }, 0);

  return construirCalc(
    costoIngredientes,
    costosFijos,
    costosVariables,
    receta.porciones,
    receta.margenGanancia,
    receta.margenMayorista
  );
}

export function generarListaComprasDesdeRecetas(
  recetas: Receta[],
  recetaIds: string[],
  ingredientes: Ingrediente[]
): Omit<ItemListaCompra, "id" | "comprado">[] {
  const agregados = new Map<string, Omit<ItemListaCompra, "id" | "comprado">>();

  recetaIds.forEach((recetaId) => {
    const receta = recetas.find((r) => r.id === recetaId);
    if (!receta) return;

    receta.ingredientesReceta.forEach((ir) => {
      const ing = ingredientes.find((i) => i.id === ir.ingredienteId);
      if (!ing) return;
      const key = ir.ingredienteId;
      const existente = agregados.get(key);
      if (existente) {
        existente.cantidad += ir.cantidad;
      } else {
        agregados.set(key, {
          ingredienteId: ing.id,
          nombre: ing.nombre,
          cantidad: ir.cantidad,
          unidad: ing.unidad,
        });
      }
    });
  });

  return Array.from(agregados.values());
}
