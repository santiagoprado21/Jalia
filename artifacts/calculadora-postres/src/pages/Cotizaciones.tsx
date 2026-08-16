import { Link } from "wouter";
import { PlusCircle, FileText, Phone, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCotizaciones, useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { formatMoneda, LOCALE } from "@/lib/moneda";
import { ESTADOS_COTIZACION } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Cotizaciones() {
  const { cotizaciones, cambiarEstado } = useCotizaciones();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();

  function totalCotizacion(c: (typeof cotizaciones)[0]) {
    return c.items.reduce((sum, item) => {
      const receta = recetas.find((r) => r.id === item.recetaId);
      if (!receta) return sum;
      const calc = calcularPrecio(receta, ingredientes);
      return sum + calc.precioVentaSugerido * item.cantidad;
    }, 0);
  }

  const sorted = [...cotizaciones].sort(
    (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Cotizaciones</h2>
          <p className="text-muted-foreground mt-1">
            {cotizaciones.length === 0
              ? "Arma presupuestos para tus clientes."
              : `${cotizaciones.length} cotizacion${cotizaciones.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <Link href="/nueva-cotizacion">
          <Button data-testid="button-nueva-cotizacion" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Nueva Cotizacion
          </Button>
        </Link>
      </div>

      {cotizaciones.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
          data-testid="empty-cotizaciones"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
            Sin cotizaciones todavia
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Crea un presupuesto para un cliente con sus postres, precio total y datos de entrega. Luego exportalo en PDF para enviarlo por WhatsApp.
          </p>
          <Link href="/nueva-cotizacion">
            <Button data-testid="button-crear-cotizacion" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Crear cotizacion
            </Button>
          </Link>
        </motion.div>
      )}

      {cotizaciones.length > 0 && (
        <div className="space-y-3">
          {sorted.map((c, i) => {
            const total = totalCotizacion(c);
            const estado = ESTADOS_COTIZACION.find((e) => e.value === c.estado);
            const fecha = new Date(c.fechaCreacion).toLocaleDateString(LOCALE, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/cotizacion/${c.id}`}>
                  <Card
                    data-testid={`card-cotizacion-${c.id}`}
                    className="border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground truncate">{c.nombreCliente}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${estado?.color}`}>
                              {estado?.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {c.items.length} {c.items.length === 1 ? "postre" : "postres"}
                            </span>
                            {c.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {c.telefono}
                              </span>
                            )}
                            {c.fechaEntrega && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(c.fechaEntrega + "T12:00:00").toLocaleDateString(LOCALE, { day: "2-digit", month: "short" })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Creada el {fecha}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-bold text-primary text-lg" data-testid={`text-total-${c.id}`}>
                              {formatMoneda(total)}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
