import { useState } from "react";
import { Link } from "wouter";
import { PlusCircle, TrendingUp, DollarSign, Package, FileDown, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { exportarPDF, exportarExcel } from "@/lib/exportar";

const categoryColors: Record<string, string> = {
  Pasteles: "bg-rose-100 text-rose-700",
  Cupcakes: "bg-pink-100 text-pink-700",
  Galletas: "bg-amber-100 text-amber-700",
  Flanes: "bg-yellow-100 text-yellow-700",
  Trufas: "bg-purple-100 text-purple-700",
  Pays: "bg-orange-100 text-orange-700",
  Brownies: "bg-stone-100 text-stone-700",
  Cheesecakes: "bg-sky-100 text-sky-700",
  Otro: "bg-gray-100 text-gray-700",
};

export default function Dashboard() {
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();
  const [exportando, setExportando] = useState<"pdf" | "excel" | null>(null);

  const recetasConCalculo = recetas.map((r) => ({
    receta: r,
    calc: calcularPrecio(r, ingredientes),
  }));

  const formatMXN = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  function handleExportPDF() {
    setExportando("pdf");
    setTimeout(() => {
      exportarPDF(recetas, ingredientes);
      setExportando(null);
    }, 100);
  }

  function handleExportExcel() {
    setExportando("excel");
    setTimeout(() => {
      exportarExcel(recetas, ingredientes);
      setExportando(null);
    }, 100);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Mis Recetas</h2>
          <p className="text-muted-foreground mt-1">
            {recetas.length === 0
              ? "Aun no tienes recetas. Crea una para empezar."
              : `${recetas.length} receta${recetas.length !== 1 ? "s" : ""} guardada${recetas.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {recetas.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={exportando === "excel"}
                data-testid="button-exportar-excel"
                className="gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exportando === "excel" ? "Exportando..." : "Excel"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exportando === "pdf"}
                data-testid="button-exportar-pdf"
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                {exportando === "pdf" ? "Generando..." : "PDF"}
              </Button>
            </>
          )}
          <Link href="/nueva-receta">
            <Button data-testid="button-nueva-receta" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Nueva Receta
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      {recetas.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Package,
              label: "Total Recetas",
              value: recetas.length,
              display: recetas.length.toString(),
              testId: "stat-total-recetas",
            },
            {
              icon: DollarSign,
              label: "Precio promedio",
              value: recetasConCalculo.reduce((s, { calc }) => s + calc.precioVentaSugerido, 0) / recetasConCalculo.length,
              display: formatMXN(recetasConCalculo.reduce((s, { calc }) => s + calc.precioVentaSugerido, 0) / recetasConCalculo.length),
              testId: "stat-precio-promedio",
            },
            {
              icon: TrendingUp,
              label: "Ganancia total estimada",
              value: recetasConCalculo.reduce((s, { calc }) => s + calc.gananciaTotal, 0),
              display: formatMXN(recetasConCalculo.reduce((s, { calc }) => s + calc.gananciaTotal, 0)),
              testId: "stat-ganancia-total",
            },
          ].map(({ icon: Icon, label, display, testId }) => (
            <Card key={label} className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground" data-testid={testId}>
                      {display}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {recetas.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
          data-testid="empty-state"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
            Todavia no hay recetas
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Agrega tus ingredientes y crea tu primera receta para saber exactamente cuanto cobrar.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/ingredientes">
              <Button variant="outline" className="gap-2" data-testid="button-agregar-ingredientes">
                <Package className="w-4 h-4" />
                Agregar Ingredientes
              </Button>
            </Link>
            <Link href="/nueva-receta">
              <Button className="gap-2" data-testid="button-crear-receta">
                <PlusCircle className="w-4 h-4" />
                Crear Receta
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Recipe cards */}
      {recetas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recetasConCalculo.map(({ receta, calc }, index) => (
            <motion.div
              key={receta.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Link
                href={`/receta/${receta.id}`}
                data-testid={`card-receta-${receta.id}`}
                className="block group"
              >
                  <Card className="border-border transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif font-semibold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                            {receta.nombre}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {receta.porciones} {receta.porciones === 1 ? "porcion" : "porciones"}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                            categoryColors[receta.categoria] ?? categoryColors["Otro"]
                          }`}
                        >
                          {receta.categoria}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/60 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-0.5">Costo por porcion</p>
                          <p
                            className="font-semibold text-sm text-foreground"
                            data-testid={`text-costo-${receta.id}`}
                          >
                            {formatMXN(calc.costoPorPorcion)}
                          </p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-0.5">Precio sugerido</p>
                          <p
                            className="font-semibold text-sm text-primary"
                            data-testid={`text-precio-${receta.id}`}
                          >
                            {formatMXN(calc.precioVentaSugerido)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Margen: {receta.margenGanancia}%</span>
                        <span>Ganancia: {formatMXN(calc.gananciaTotal)}</span>
                      </div>
                    </CardContent>
                  </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
