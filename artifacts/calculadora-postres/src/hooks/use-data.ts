import { useCallback } from "react";
import { useJaliaDatos, useJaliaSetDatos } from "@/contexts/jalia-data-context";
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
  margenMayorista?: number,
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
  const { ingredientes } = useJaliaDatos();
  const setDatos = useJaliaSetDatos();

  const agregarIngrediente = useCallback(
    (data: Omit<Ingrediente, "id" | "costoPorUnidad">) => {
      const nuevo: Ingrediente = {
        ...data,
        id: crypto.randomUUID(),
        costoPorUnidad: data.cantidadTotal > 0 ? data.costoTotal / data.cantidadTotal : 0,
      };
      setDatos((prev) => ({ ...prev, ingredientes: [...prev.ingredientes, nuevo] }));
      return nuevo;
    },
    [setDatos],
  );

  const actualizarIngrediente = useCallback(
    (id: string, data: Omit<Ingrediente, "id" | "costoPorUnidad">) => {
      setDatos((prev) => ({
        ...prev,
        ingredientes: prev.ingredientes.map((ing) =>
          ing.id === id
            ? {
                ...ing,
                ...data,
                costoPorUnidad: data.cantidadTotal > 0 ? data.costoTotal / data.cantidadTotal : 0,
              }
            : ing,
        ),
      }));
    },
    [setDatos],
  );

  const eliminarIngrediente = useCallback(
    (id: string) => {
      setDatos((prev) => ({
        ...prev,
        ingredientes: prev.ingredientes.filter((ing) => ing.id !== id),
      }));
    },
    [setDatos],
  );

  return { ingredientes, agregarIngrediente, actualizarIngrediente, eliminarIngrediente };
}

export function useRecetas() {
  const { recetas } = useJaliaDatos();
  const setDatos = useJaliaSetDatos();

  const agregarReceta = useCallback(
    (data: Omit<Receta, "id" | "fechaCreacion">) => {
      const nueva: Receta = {
        ...data,
        id: crypto.randomUUID(),
        fechaCreacion: new Date().toISOString(),
      };
      setDatos((prev) => ({ ...prev, recetas: [...prev.recetas, nueva] }));
      return nueva;
    },
    [setDatos],
  );

  const actualizarReceta = useCallback(
    (id: string, data: Partial<Omit<Receta, "id" | "fechaCreacion">>) => {
      setDatos((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === id ? { ...r, ...data } : r)),
      }));
    },
    [setDatos],
  );

  const eliminarReceta = useCallback(
    (id: string) => {
      setDatos((prev) => ({
        ...prev,
        recetas: prev.recetas.filter((r) => r.id !== id),
      }));
    },
    [setDatos],
  );

  const getReceta = useCallback((id: string) => recetas.find((r) => r.id === id), [recetas]);

  return { recetas, agregarReceta, actualizarReceta, eliminarReceta, getReceta };
}

export function useCotizaciones() {
  const { cotizaciones } = useJaliaDatos();
  const setDatos = useJaliaSetDatos();

  const agregarCotizacion = useCallback(
    (data: Omit<Cotizacion, "id" | "fechaCreacion">) => {
      const nueva: Cotizacion = {
        ...data,
        id: crypto.randomUUID(),
        fechaCreacion: new Date().toISOString(),
      };
      setDatos((prev) => ({ ...prev, cotizaciones: [...prev.cotizaciones, nueva] }));
      return nueva;
    },
    [setDatos],
  );

  const actualizarCotizacion = useCallback(
    (id: string, data: Partial<Omit<Cotizacion, "id" | "fechaCreacion">>) => {
      setDatos((prev) => ({
        ...prev,
        cotizaciones: prev.cotizaciones.map((c) => (c.id === id ? { ...c, ...data } : c)),
      }));
    },
    [setDatos],
  );

  const cambiarEstado = useCallback(
    (id: string, estado: Cotizacion["estado"]) => {
      setDatos((prev) => ({
        ...prev,
        cotizaciones: prev.cotizaciones.map((c) => (c.id === id ? { ...c, estado } : c)),
      }));
    },
    [setDatos],
  );

  const eliminarCotizacion = useCallback(
    (id: string) => {
      setDatos((prev) => ({
        ...prev,
        cotizaciones: prev.cotizaciones.filter((c) => c.id !== id),
      }));
    },
    [setDatos],
  );

  const getCotizacion = useCallback(
    (id: string) => cotizaciones.find((c) => c.id === id),
    [cotizaciones],
  );

  return {
    cotizaciones,
    agregarCotizacion,
    actualizarCotizacion,
    cambiarEstado,
    eliminarCotizacion,
    getCotizacion,
  };
}

export function useVentas() {
  const { ventas } = useJaliaDatos();
  const setDatos = useJaliaSetDatos();

  const guardarVenta = useCallback(
    (data: Omit<VentaDiaria, "id">) => {
      let result: VentaDiaria | undefined;
      setDatos((prev) => {
        const existente = prev.ventas.find((v) => v.fecha === data.fecha);
        if (existente) {
          result = { ...existente, ...data };
          return {
            ...prev,
            ventas: prev.ventas.map((v) => (v.fecha === data.fecha ? result! : v)),
          };
        }
        result = { ...data, id: crypto.randomUUID() };
        return { ...prev, ventas: [...prev.ventas, result] };
      });
      return result!;
    },
    [setDatos],
  );

  const eliminarVenta = useCallback(
    (fecha: string) => {
      setDatos((prev) => ({
        ...prev,
        ventas: prev.ventas.filter((v) => v.fecha !== fecha),
      }));
    },
    [setDatos],
  );

  const getVentaPorFecha = useCallback(
    (fecha: string) => ventas.find((v) => v.fecha === fecha),
    [ventas],
  );

  const getVentasSemana = useCallback(
    (inicioSemana: string) => {
      const inicio = new Date(inicioSemana + "T00:00:00");
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 6);
      return ventas.filter((v) => {
        const d = new Date(v.fecha + "T00:00:00");
        return d >= inicio && d <= fin;
      });
    },
    [ventas],
  );

  const getVentasMes = useCallback(
    (anio: number, mes: number) =>
      ventas.filter((v) => {
        const d = new Date(v.fecha + "T12:00:00");
        return d.getFullYear() === anio && d.getMonth() === mes;
      }),
    [ventas],
  );

  return { ventas, guardarVenta, eliminarVenta, getVentaPorFecha, getVentasSemana, getVentasMes };
}

export function useListaCompras() {
  const { listaCompras: items } = useJaliaDatos();
  const setDatos = useJaliaSetDatos();

  const agregarItem = useCallback(
    (data: Omit<ItemListaCompra, "id" | "comprado">) => {
      const nuevo: ItemListaCompra = { ...data, id: crypto.randomUUID(), comprado: false };
      setDatos((prev) => ({ ...prev, listaCompras: [...prev.listaCompras, nuevo] }));
      return nuevo;
    },
    [setDatos],
  );

  const actualizarItem = useCallback(
    (id: string, data: Partial<Omit<ItemListaCompra, "id">>) => {
      setDatos((prev) => ({
        ...prev,
        listaCompras: prev.listaCompras.map((i) => (i.id === id ? { ...i, ...data } : i)),
      }));
    },
    [setDatos],
  );

  const toggleComprado = useCallback(
    (id: string) => {
      setDatos((prev) => ({
        ...prev,
        listaCompras: prev.listaCompras.map((i) =>
          i.id === id ? { ...i, comprado: !i.comprado } : i,
        ),
      }));
    },
    [setDatos],
  );

  const eliminarItem = useCallback(
    (id: string) => {
      setDatos((prev) => ({
        ...prev,
        listaCompras: prev.listaCompras.filter((i) => i.id !== id),
      }));
    },
    [setDatos],
  );

  const limpiarComprados = useCallback(() => {
    setDatos((prev) => ({
      ...prev,
      listaCompras: prev.listaCompras.filter((i) => !i.comprado),
    }));
  }, [setDatos]);

  const reemplazarItems = useCallback(
    (nuevos: ItemListaCompra[]) => {
      setDatos((prev) => ({ ...prev, listaCompras: nuevos }));
    },
    [setDatos],
  );

  return {
    items,
    agregarItem,
    actualizarItem,
    toggleComprado,
    eliminarItem,
    limpiarComprados,
    reemplazarItems,
  };
}

export function useConsignaciones() {
  const { consignaciones } = useJaliaDatos();
  const setDatos = useJaliaSetDatos();

  const agregarConsignacion = useCallback(
    (data: Omit<Consignacion, "id" | "pagos" | "estado"> & { estado?: Consignacion["estado"] }) => {
      const nueva: Consignacion = {
        ...data,
        id: crypto.randomUUID(),
        pagos: [],
        estado: data.estado ?? "activa",
      };
      setDatos((prev) => ({ ...prev, consignaciones: [...prev.consignaciones, nueva] }));
      return nueva;
    },
    [setDatos],
  );

  const actualizarConsignacion = useCallback(
    (id: string, data: Partial<Omit<Consignacion, "id">>) => {
      setDatos((prev) => ({
        ...prev,
        consignaciones: prev.consignaciones.map((c) => (c.id === id ? { ...c, ...data } : c)),
      }));
    },
    [setDatos],
  );

  const registrarVentaConsignacion = useCallback(
    (id: string, cantidadVendida: number) => {
      setDatos((prev) => ({
        ...prev,
        consignaciones: prev.consignaciones.map((c) => {
          if (c.id !== id) return c;
          const vendidas = Math.min(c.cantidadEntregada, cantidadVendida);
          const estado =
            vendidas >= c.cantidadEntregada ? "liquidada" : vendidas > 0 ? "parcial" : "activa";
          return { ...c, cantidadVendida: vendidas, estado };
        }),
      }));
    },
    [setDatos],
  );

  const registrarPago = useCallback(
    (id: string, monto: number, formaPago: FormaPago, notas?: string) => {
      setDatos((prev) => ({
        ...prev,
        consignaciones: prev.consignaciones.map((c) => {
          if (c.id !== id) return c;
          const pagos = [
            ...c.pagos,
            {
              id: crypto.randomUUID(),
              fecha: new Date().toISOString().slice(0, 10),
              monto,
              formaPago,
              notas,
            },
          ];
          const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
          const totalEsperado = c.cantidadVendida * c.precioUnitario;
          const estado =
            totalPagado >= totalEsperado && c.cantidadVendida >= c.cantidadEntregada
              ? "liquidada"
              : totalPagado > 0 || c.cantidadVendida > 0
                ? "parcial"
                : "activa";
          return { ...c, pagos, estado };
        }),
      }));
    },
    [setDatos],
  );

  const eliminarConsignacion = useCallback(
    (id: string) => {
      setDatos((prev) => ({
        ...prev,
        consignaciones: prev.consignaciones.filter((c) => c.id !== id),
      }));
    },
    [setDatos],
  );

  const getConsignacion = useCallback(
    (id: string) => consignaciones.find((c) => c.id === id),
    [consignaciones],
  );

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
  ingredientes: Ingrediente[],
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
    receta.margenMayorista,
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
    receta.margenMayorista,
  );
}

export function generarListaComprasDesdeRecetas(
  recetas: Receta[],
  recetaIds: string[],
  ingredientes: Ingrediente[],
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
