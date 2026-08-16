import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, FileDown, Trash2, CheckCircle2, Clock, Package } from "lucide-react";
import { useCotizaciones, useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { formatMoneda, LOCALE } from "@/lib/moneda";
import { ESTADOS_COTIZACION, type Cotizacion } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { exportarCotizacionPDF } from "@/lib/exportar";

export default function CotizacionDetalle() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getCotizacion, cambiarEstado, eliminarCotizacion } = useCotizaciones();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportando, setExportando] = useState(false);

  const cotizacion = getCotizacion(params.id);

  if (!cotizacion) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Cotizacion no encontrada.</p>
        <Link href="/cotizaciones">
          <Button className="mt-4" data-testid="button-volver">Volver</Button>
        </Link>
      </div>
    );
  }

  const itemsConDetalle = cotizacion.items.map((item) => {
    const receta = recetas.find((r) => r.id === item.recetaId);
    if (!receta) return null;
    const calc = calcularPrecio(receta, ingredientes);
    return {
      nombre: receta.nombre,
      categoria: receta.categoria,
      precioUnit: calc.precioVentaSugerido,
      cantidad: item.cantidad,
      subtotal: calc.precioVentaSugerido * item.cantidad,
    };
  }).filter(Boolean) as { nombre: string; categoria: string; precioUnit: number; cantidad: number; subtotal: number }[];

  const total = itemsConDetalle.reduce((s, i) => s + i.subtotal, 0);

  const estado = ESTADOS_COTIZACION.find((e) => e.value === cotizacion.estado);

  const fechaCreacion = new Date(cotizacion.fechaCreacion).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  function handleExportPDF() {
    setExportando(true);
    setTimeout(() => {
      exportarCotizacionPDF(cotizacion, recetas, ingredientes);
      setExportando(false);
    }, 100);
  }

  function handleDelete() {
    eliminarCotizacion(cotizacion.id);
    setLocation("/cotizaciones");
  }

  function handleWhatsApp() {
    const lineas = itemsConDetalle.map(
      (i) => `• ${i.cantidad}x ${i.nombre} — ${formatMoneda(i.subtotal)}`
    ).join("\n");

    const fecha = cotizacion.fechaEntrega
      ? new Date(cotizacion.fechaEntrega + "T12:00:00").toLocaleDateString(LOCALE, { day: "2-digit", month: "long", year: "numeric" })
      : null;

    const mensaje = [
      `Hola ${cotizacion.nombreCliente}, te comparto tu cotizacion de JALIA:`,
      "",
      lineas,
      "",
      `*Total: ${formatMoneda(total)}*`,
      fecha ? `Fecha de entrega: ${fecha}` : "",
      cotizacion.notas ? `Notas: ${cotizacion.notas}` : "",
    ].filter((l) => l !== undefined && !(l === "" && !fecha && !cotizacion.notas)).join("\n");

    const numero = cotizacion.telefono?.replace(/\D/g, "") ?? "";
    const url = `https://wa.me/${numero ? `52${numero}` : ""}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/cotizaciones">
            <Button variant="ghost" size="icon" data-testid="button-volver">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground">{cotizacion.nombreCliente}</h2>
            <p className="text-muted-foreground mt-1">Creada el {fechaCreacion}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exportando}
            data-testid="button-exportar-pdf-cotizacion"
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            {exportando ? "Generando..." : "PDF"}
          </Button>
          <Button
            size="sm"
            onClick={handleWhatsApp}
            data-testid="button-whatsapp"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            data-testid="button-eliminar-cotizacion"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Estado del pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Select
                  value={cotizacion.estado}
                  onValueChange={(v) => cambiarEstado(cotizacion.id, v as Cotizacion["estado"])}
                >
                  <SelectTrigger className="w-48" data-testid="select-estado-cotizacion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_COTIZACION.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${estado?.color}`}>
                  {estado?.label}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Client details */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Datos del cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre</span>
                <span className="font-medium">{cotizacion.nombreCliente}</span>
              </div>
              {cotizacion.telefono && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefono</span>
                  <span className="font-medium">{cotizacion.telefono}</span>
                </div>
              )}
              {cotizacion.fechaEntrega && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha de entrega</span>
                  <span className="font-medium">
                    {new Date(cotizacion.fechaEntrega + "T12:00:00").toLocaleDateString(LOCALE, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {cotizacion.notas && (
                <div>
                  <p className="text-muted-foreground mb-1">Notas</p>
                  <p className="bg-muted/60 rounded-lg px-3 py-2 text-foreground">{cotizacion.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Postres del pedido</CardTitle>
            </CardHeader>
            <CardContent>
              {itemsConDetalle.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Los postres ya no estan disponibles en tu lista de recetas.
                </p>
              ) : (
                <div className="space-y-3">
                  {itemsConDetalle.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{item.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.cantidad} {item.cantidad === 1 ? "pieza" : "piezas"} × {formatMoneda(item.precioUnit)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm" data-testid={`text-subtotal-${i}`}>
                        {formatMoneda(item.subtotal)}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary text-lg" data-testid="text-total-cotizacion">
                      {formatMoneda(total)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Total del pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary" data-testid="text-total-panel">
                  {formatMoneda(total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {itemsConDetalle.length} tipo{itemsConDetalle.length !== 1 ? "s" : ""} de postre
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">Compartir</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleWhatsApp}
                  data-testid="button-whatsapp-panel"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar por WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleExportPDF}
                  disabled={exportando}
                  data-testid="button-pdf-panel"
                >
                  <FileDown className="w-4 h-4" />
                  {exportando ? "Generando..." : "Descargar PDF"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cotizacion</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara la cotizacion de "{cotizacion.nombreCliente}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
