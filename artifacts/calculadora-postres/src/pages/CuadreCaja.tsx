import { useState } from "react";
import { Link } from "wouter";
import { PlusCircle, TrendingUp, DollarSign, ShoppingBag, ChevronLeft, ChevronRight, BarChart3, Pencil, Trash2, FileDown, CalendarDays } from "lucide-react";
import { useVentas, useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { FORMAS_PAGO, type FormaPago } from "@/types";
import { toISODate, formatMes, getDiasMes, formatFecha } from "@/lib/semana";
import { formatMoneda } from "@/lib/moneda";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportarCuadreMensualPDF } from "@/lib/exportar";

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function calcularTotalesVenta(
  venta: { items: { recetaId: string; cantidad: number; precioVenta: number; formaPago?: FormaPago }[] } | undefined,
  recetas: ReturnType<typeof useRecetas>["recetas"],
  ingredientes: ReturnType<typeof useIngredientes>["ingredientes"]
) {
  if (!venta || venta.items.length === 0) {
    return { ingresos: 0, costos: 0, ganancia: 0, unidades: 0, pagos: { efectivo: 0, nequi: 0, llave: 0 } };
  }

  let ingresos = 0;
  let costos = 0;
  let unidades = 0;
  const pagos: Record<FormaPago, number> = { efectivo: 0, nequi: 0, llave: 0 };

  venta.items.forEach((item) => {
    const receta = recetas.find((r) => r.id === item.recetaId);
    const subtotal = item.precioVenta * item.cantidad;
    ingresos += subtotal;
    unidades += item.cantidad;
    const forma: FormaPago = item.formaPago ?? "efectivo";
    pagos[forma] += subtotal;
    if (receta) {
      costos += calcularPrecio(receta, ingredientes).costoPorPorcion * item.cantidad;
    }
  });

  return { ingresos, costos, ganancia: ingresos - costos, unidades, pagos };
}

export default function CuadreCaja() {
  const { ventas, getVentasMes, eliminarVenta } = useVentas();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();

  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(toISODate(hoy));
  const [deleteDate, setDeleteDate] = useState<string | null>(null);

  const ventasMes = getVentasMes(anio, mes);
  const diasMes = getDiasMes(anio, mes);
  const hoyISO = toISODate(hoy);

  const fechasConVentas = new Set(ventasMes.map((v) => v.fecha));

  function mesAnterior() {
    if (mes === 0) {
      setMes(11);
      setAnio((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  }

  function mesSiguiente() {
    if (mes === 11) {
      setMes(0);
      setAnio((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  }

  function irMesActual() {
    setAnio(hoy.getFullYear());
    setMes(hoy.getMonth());
    setFechaSeleccionada(hoyISO);
  }

  const totalesMes = ventasMes.reduce(
    (acc, venta) => {
      const t = calcularTotalesVenta(venta, recetas, ingredientes);
      return {
        ingresos: acc.ingresos + t.ingresos,
        costos: acc.costos + t.costos,
        ganancia: acc.ganancia + t.ganancia,
        unidades: acc.unidades + t.unidades,
        pagos: {
          efectivo: acc.pagos.efectivo + t.pagos.efectivo,
          nequi: acc.pagos.nequi + t.pagos.nequi,
          llave: acc.pagos.llave + t.pagos.llave,
        },
      };
    },
    { ingresos: 0, costos: 0, ganancia: 0, unidades: 0, pagos: { efectivo: 0, nequi: 0, llave: 0 } }
  );

  const ventaSeleccionada = fechaSeleccionada ? ventasMes.find((v) => v.fecha === fechaSeleccionada) : undefined;
  const totalesDia = calcularTotalesVenta(ventaSeleccionada, recetas, ingredientes);

  const ventasMap: Record<string, { nombre: string; unidades: number; ingresos: number }> = {};
  ventasMes.forEach((v) => {
    v.items.forEach((item) => {
      const receta = recetas.find((r) => r.id === item.recetaId);
      if (!receta) return;
      if (!ventasMap[item.recetaId]) {
        ventasMap[item.recetaId] = { nombre: receta.nombre, unidades: 0, ingresos: 0 };
      }
      ventasMap[item.recetaId].unidades += item.cantidad;
      ventasMap[item.recetaId].ingresos += item.precioVenta * item.cantidad;
    });
  });
  const mejoresProductos = Object.values(ventasMap).sort((a, b) => b.ingresos - a.ingresos).slice(0, 5);

  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Cuadre de Caja</h2>
          <p className="text-muted-foreground mt-1">
            Calendario libre — registra el cuadre el día que prefieras (ej. lunes por ventas del fin de semana)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportarCuadreMensualPDF(anio, mes, ventas, recetas, ingredientes)}
            data-testid="button-exportar-cuadre-pdf"
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Link href={`/caja/venta/${fechaSeleccionada ?? hoyISO}`}>
            <Button data-testid="button-registrar-venta" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Registrar cuadre
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 bg-card border border-border rounded-xl px-4 py-3">
        <Button variant="ghost" size="icon" onClick={mesAnterior} data-testid="button-mes-anterior">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="font-semibold text-foreground flex items-center justify-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            {formatMes(anio, mes)}
          </p>
          {!esMesActual ? (
            <button onClick={irMesActual} className="text-xs text-muted-foreground hover:text-primary underline">
              Ir al mes actual
            </button>
          ) : (
            <p className="text-xs text-primary font-medium">Mes actual</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={mesSiguiente} data-testid="button-mes-siguiente">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: DollarSign, label: "Ingresos del mes", value: formatMoneda(totalesMes.ingresos), color: "text-primary", testId: "stat-ingresos" },
          { icon: ShoppingBag, label: "Costos", value: formatMoneda(totalesMes.costos), color: "text-orange-600", testId: "stat-costos" },
          { icon: TrendingUp, label: "Ganancia", value: formatMoneda(totalesMes.ganancia), color: "text-green-700", testId: "stat-ganancia" },
          { icon: BarChart3, label: "Unidades", value: totalesMes.unidades.toString(), color: "text-foreground", testId: "stat-unidades" },
        ].map(({ icon: Icon, label, value, color, testId }) => (
          <Card key={label} className="border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className={`font-bold text-lg ${color}`} data-testid={testId}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Calendario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DIAS_CORTOS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasMes.map((fecha, i) => {
                  if (!fecha) {
                    return <div key={`empty-${i}`} className="aspect-square" />;
                  }
                  const tieneVentas = fechasConVentas.has(fecha);
                  const esHoy = fecha === hoyISO;
                  const seleccionado = fecha === fechaSeleccionada;

                  return (
                    <button
                      key={fecha}
                      type="button"
                      onClick={() => setFechaSeleccionada(fecha)}
                      data-testid={`cal-dia-${fecha}`}
                      className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center border transition-colors ${
                        seleccionado
                          ? "border-primary bg-primary text-primary-foreground font-bold"
                          : esHoy
                          ? "border-primary/40 bg-primary/5 font-semibold"
                          : tieneVentas
                          ? "border-green-300 bg-green-50 hover:border-primary/30"
                          : "border-border hover:border-primary/20 hover:bg-muted/40"
                      }`}
                    >
                      <span>{parseInt(fecha.slice(8), 10)}</span>
                      {tieneVentas && !seleccionado && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {fechaSeleccionada && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-lg capitalize">
                  {formatFecha(fechaSeleccionada)}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Link href={`/caja/venta/${fechaSeleccionada}`}>
                    <Button variant="ghost" size="icon" data-testid={`button-editar-venta-${fechaSeleccionada}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  {ventaSeleccionada && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDate(fechaSeleccionada)}
                      data-testid={`button-eliminar-venta-${fechaSeleccionada}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {totalesDia.ingresos > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Ingresos</p>
                        <p className="font-semibold text-primary">{formatMoneda(totalesDia.ingresos)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ganancia</p>
                        <p className="font-semibold text-green-700">{formatMoneda(totalesDia.ganancia)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unidades</p>
                        <p className="font-semibold">{totalesDia.unidades}</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Formas de pago</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {FORMAS_PAGO.map(({ value, label }) => (
                          <div key={value} className="bg-muted/40 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="font-semibold">{formatMoneda(totalesDia.pagos[value])}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Sin cuadre registrado. Puedes registrar aquí las ventas del fin de semana u otro periodo.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Formas de pago (mes)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {FORMAS_PAGO.map(({ value, label }) => (
                <div key={value} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{formatMoneda(totalesMes.pagos[value])}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Lo más vendido</CardTitle>
            </CardHeader>
            <CardContent>
              {mejoresProductos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Registra ventas para ver tus productos más populares.
                </p>
              ) : (
                <div className="space-y-3">
                  {mejoresProductos.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground">{p.unidades} uds.</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-primary shrink-0">{formatMoneda(p.ingresos)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="font-serif text-base">Resumen del mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ingresos totales</span>
                <span className="font-semibold text-primary">{formatMoneda(totalesMes.ingresos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costos estimados</span>
                <span className="font-semibold text-orange-600">{formatMoneda(totalesMes.costos)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Ganancia neta</span>
                <span className="font-bold text-green-700" data-testid="stat-ganancia-neta">
                  {formatMoneda(totalesMes.ganancia)}
                </span>
              </div>
              {totalesMes.ingresos > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margen real</span>
                  <span className="font-semibold text-foreground">
                    {Math.round((totalesMes.ganancia / totalesMes.ingresos) * 100)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!deleteDate} onOpenChange={() => setDeleteDate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar registro</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDate && `Se eliminarán las ventas del ${formatFecha(deleteDate)}. Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteDate) eliminarVenta(deleteDate); setDeleteDate(null); }}
              data-testid="button-confirmar-eliminar"
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
