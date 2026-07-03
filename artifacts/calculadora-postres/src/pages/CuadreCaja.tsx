import { useState } from "react";
import { Link } from "wouter";
import { PlusCircle, TrendingUp, DollarSign, ShoppingBag, ChevronLeft, ChevronRight, BarChart3, Pencil, Trash2, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { useVentas, useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { DIAS_SEMANA } from "@/types";
import { getLunesDeSemana, toISODate, formatSemana, getDiasSemana, formatFecha } from "@/lib/semana";
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
import { exportarCuadreSemanalPDF } from "@/lib/exportar";

export default function CuadreCaja() {
  const { ventas, getVentasSemana, eliminarVenta } = useVentas();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();

  const lunesHoy = toISODate(getLunesDeSemana(new Date()));
  const [lunesActual, setLunesActual] = useState(lunesHoy);
  const [deleteDate, setDeleteDate] = useState<string | null>(null);

  const diasSemana = getDiasSemana(lunesActual);
  const ventasSemana = getVentasSemana(lunesActual);

  function irSemanaAnterior() {
    const d = new Date(lunesActual + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setLunesActual(toISODate(d));
  }

  function irSemanaSiguiente() {
    const d = new Date(lunesActual + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setLunesActual(toISODate(d));
  }

  const formatMXN = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  function calcularTotalesDia(fecha: string) {
    const venta = ventasSemana.find((v) => v.fecha === fecha);
    if (!venta || venta.items.length === 0) return { ingresos: 0, costos: 0, ganancia: 0, unidades: 0 };
    let ingresos = 0, costos = 0, unidades = 0;
    venta.items.forEach((item) => {
      const receta = recetas.find((r) => r.id === item.recetaId);
      ingresos += item.precioVenta * item.cantidad;
      unidades += item.cantidad;
      if (receta) {
        const calc = calcularPrecio(receta, ingredientes);
        costos += calc.costoPorPorcion * item.cantidad;
      }
    });
    return { ingresos, costos, ganancia: ingresos - costos, unidades };
  }

  const totalesSemana = diasSemana.reduce(
    (acc, fecha) => {
      const t = calcularTotalesDia(fecha);
      return {
        ingresos: acc.ingresos + t.ingresos,
        costos: acc.costos + t.costos,
        ganancia: acc.ganancia + t.ganancia,
        unidades: acc.unidades + t.unidades,
      };
    },
    { ingresos: 0, costos: 0, ganancia: 0, unidades: 0 }
  );

  // Best sellers this week
  const ventasMap: Record<string, { nombre: string; unidades: number; ingresos: number }> = {};
  ventasSemana.forEach((v) => {
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

  const hoy = toISODate(new Date());

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Cuadre de Caja</h2>
          <p className="text-muted-foreground mt-1">Resumen semanal de ventas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportarCuadreSemanalPDF(lunesActual, ventas, recetas, ingredientes)}
            data-testid="button-exportar-cuadre-pdf"
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Link href={`/caja/venta/${hoy}`}>
            <Button data-testid="button-registrar-venta" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Registrar venta
            </Button>
          </Link>
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between mb-6 bg-card border border-border rounded-xl px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={irSemanaAnterior}
          data-testid="button-semana-anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="font-semibold text-foreground">{formatSemana(lunesActual)}</p>
          {lunesActual === lunesHoy
            ? <p className="text-xs text-primary font-medium">Semana actual</p>
            : <button onClick={() => setLunesActual(lunesHoy)} className="text-xs text-muted-foreground hover:text-primary underline">Ir a semana actual</button>
          }
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={irSemanaSiguiente}
          disabled={lunesActual >= lunesHoy}
          data-testid="button-semana-siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: DollarSign, label: "Ingresos", value: formatMXN(totalesSemana.ingresos), color: "text-primary", testId: "stat-ingresos" },
          { icon: ShoppingBag, label: "Costos", value: formatMXN(totalesSemana.costos), color: "text-orange-600", testId: "stat-costos" },
          { icon: TrendingUp, label: "Ganancia", value: formatMXN(totalesSemana.ganancia), color: "text-green-700", testId: "stat-ganancia" },
          { icon: BarChart3, label: "Unidades", value: totalesSemana.unidades.toString(), color: "text-foreground", testId: "stat-unidades" },
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
        {/* Daily breakdown */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Ventas por día</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {diasSemana.map((fecha, i) => {
                const t = calcularTotalesDia(fecha);
                const venta = ventasSemana.find((v) => v.fecha === fecha);
                const esHoy = fecha === hoy;
                const esFuturo = fecha > hoy;
                const nombre = DIAS_SEMANA[i];

                return (
                  <motion.div
                    key={fecha}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    data-testid={`row-dia-${fecha}`}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
                      esHoy
                        ? "border-primary/40 bg-primary/5"
                        : esFuturo
                        ? "border-border bg-muted/20 opacity-50"
                        : t.ingresos > 0
                        ? "border-border bg-card hover:border-primary/30"
                        : "border-border bg-card opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-16 shrink-0">
                        <p className={`text-sm font-semibold ${esHoy ? "text-primary" : "text-foreground"}`}>
                          {nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      {t.ingresos > 0 ? (
                        <div className="flex items-center gap-4 text-sm flex-1">
                          <div>
                            <p className="text-xs text-muted-foreground">Ingresos</p>
                            <p className="font-semibold text-primary">{formatMXN(t.ingresos)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ganancia</p>
                            <p className="font-semibold text-green-700">{formatMXN(t.ganancia)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Unidades</p>
                            <p className="font-semibold text-foreground">{t.unidades}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {esFuturo ? "—" : "Sin ventas registradas"}
                        </p>
                      )}
                    </div>
                    {!esFuturo && (
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Link href={`/caja/venta/${fecha}`}>
                          <Button variant="ghost" size="icon" data-testid={`button-editar-venta-${fecha}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        {venta && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDate(fecha)}
                            data-testid={`button-eliminar-venta-${fecha}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Best sellers + margin */}
        <div className="space-y-4">
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
                      <p className="text-sm font-semibold text-primary shrink-0">{formatMXN(p.ingresos)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="font-serif text-base">Resumen semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ingresos totales</span>
                <span className="font-semibold text-primary">{formatMXN(totalesSemana.ingresos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costos estimados</span>
                <span className="font-semibold text-orange-600">{formatMXN(totalesSemana.costos)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Ganancia neta</span>
                <span className="font-bold text-green-700" data-testid="stat-ganancia-neta">
                  {formatMXN(totalesSemana.ganancia)}
                </span>
              </div>
              {totalesSemana.ingresos > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margen real</span>
                  <span className="font-semibold text-foreground">
                    {Math.round((totalesSemana.ganancia / totalesSemana.ingresos) * 100)}%
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
              {deleteDate && `Se eliminaran las ventas del ${formatFecha(deleteDate)}. Esta accion no se puede deshacer.`}
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
