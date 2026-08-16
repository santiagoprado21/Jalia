import { useState } from "react";
import { Plus, Trash2, Wallet, DollarSign, Package } from "lucide-react";
import {
  useConsignaciones,
  useRecetas,
  useIngredientes,
  calcularPrecio,
} from "@/hooks/use-data";
import { ESTADOS_CONSIGNACION, FORMAS_PAGO, type FormaPago } from "@/types";
import { formatMoneda, redondearPrecio } from "@/lib/moneda";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

export default function Cartera() {
  const { consignaciones, agregarConsignacion, registrarVentaConsignacion, registrarPago, eliminarConsignacion } =
    useConsignaciones();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [nueva, setNueva] = useState({
    clienteNombre: "",
    telefono: "",
    recetaId: "",
    cantidadEntregada: 1,
    precioUnitario: 0,
    fechaEntrega: new Date().toISOString().slice(0, 10),
    notas: "",
  });
  const [pago, setPago] = useState({ monto: 0, formaPago: "efectivo" as FormaPago, vendidas: 0 });

  const activas = consignaciones.filter((c) => c.estado !== "liquidada");
  const totalPorCobrar = activas.reduce((sum, c) => {
    const esperado = c.cantidadVendida * c.precioUnitario;
    const pagado = c.pagos.reduce((s, p) => s + p.monto, 0);
    return sum + Math.max(0, esperado - pagado);
  }, 0);

  function abrirNueva() {
    setNueva({
      clienteNombre: "",
      telefono: "",
      recetaId: recetas[0]?.id ?? "",
      cantidadEntregada: 1,
      precioUnitario: recetas[0] ? calcularPrecio(recetas[0], ingredientes).precioVentaSugerido : 0,
      fechaEntrega: new Date().toISOString().slice(0, 10),
      notas: "",
    });
    setDialogOpen(true);
  }

  function handleCrear() {
    if (!nueva.clienteNombre.trim() || !nueva.recetaId) return;
    agregarConsignacion({
      clienteNombre: nueva.clienteNombre.trim(),
      telefono: nueva.telefono || undefined,
      recetaId: nueva.recetaId,
      cantidadEntregada: nueva.cantidadEntregada,
      cantidadVendida: 0,
      precioUnitario: redondearPrecio(nueva.precioUnitario),
      fechaEntrega: nueva.fechaEntrega,
      notas: nueva.notas || undefined,
    });
    setDialogOpen(false);
  }

  function abrirPago(c: (typeof consignaciones)[0]) {
    const pendiente = c.cantidadVendida * c.precioUnitario - c.pagos.reduce((s, p) => s + p.monto, 0);
    setPago({
      monto: Math.max(0, redondearPrecio(pendiente)),
      formaPago: "efectivo",
      vendidas: c.cantidadVendida,
    });
    setPagoOpen(c.id);
  }

  function handlePago() {
    if (!pagoOpen) return;
    const c = consignaciones.find((x) => x.id === pagoOpen);
    if (!c) return;
    if (pago.vendidas !== c.cantidadVendida) {
      registrarVentaConsignacion(pagoOpen, pago.vendidas);
    }
    if (pago.monto > 0) {
      registrarPago(pagoOpen, redondearPrecio(pago.monto), pago.formaPago);
    }
    setPagoOpen(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Cartera y consignación</h2>
          <p className="text-muted-foreground mt-1">
            Control de productos en consignación y seguimiento de ventas a crédito
          </p>
        </div>
        <Button onClick={abrirNueva} className="gap-2" disabled={recetas.length === 0}>
          <Plus className="w-4 h-4" />
          Nueva consignación
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consignaciones activas</p>
              <p className="font-bold text-lg">{activas.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Por cobrar</p>
              <p className="font-bold text-lg text-orange-600">{formatMoneda(totalPorCobrar)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {consignaciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="w-12 h-12 text-primary/40 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold mb-2">Sin consignaciones</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Registra los productos que dejas en tiendas o con clientes y haz seguimiento de lo vendido y lo que te deben.
            </p>
            <Button onClick={abrirNueva} disabled={recetas.length === 0}>Nueva consignación</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...consignaciones]
            .sort((a, b) => b.fechaEntrega.localeCompare(a.fechaEntrega))
            .map((c) => {
              const receta = recetas.find((r) => r.id === c.recetaId);
              const estado = ESTADOS_CONSIGNACION.find((e) => e.value === c.estado);
              const totalEsperado = c.cantidadVendida * c.precioUnitario;
              const totalPagado = c.pagos.reduce((s, p) => s + p.monto, 0);
              const saldo = totalEsperado - totalPagado;
              const restantes = c.cantidadEntregada - c.cantidadVendida;

              return (
                <Card key={c.id} className="hover:border-primary/20 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground">{c.clienteNombre}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estado?.color}`}>
                            {estado?.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {receta?.nombre ?? "Producto"} · {c.cantidadEntregada} entregadas · {c.cantidadVendida} vendidas · {restantes} en stock
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Entrega: {c.fechaEntrega}
                          {c.telefono && ` · ${c.telefono}`}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Precio: <strong>{formatMoneda(c.precioUnitario)}</strong></span>
                          <span>Esperado: <strong>{formatMoneda(totalEsperado)}</strong></span>
                          <span>Pagado: <strong className="text-green-700">{formatMoneda(totalPagado)}</strong></span>
                          {saldo > 0 && (
                            <span>Saldo: <strong className="text-orange-600">{formatMoneda(saldo)}</strong></span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {c.estado !== "liquidada" && (
                          <Button variant="outline" size="sm" onClick={() => abrirPago(c)} className="gap-1">
                            <DollarSign className="w-3 h-3" />
                            Registrar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva consignación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Cliente / tienda</label>
              <Input value={nueva.clienteNombre} onChange={(e) => setNueva({ ...nueva, clienteNombre: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono (opcional)</label>
              <Input value={nueva.telefono} onChange={(e) => setNueva({ ...nueva, telefono: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Producto</label>
              <Select
                value={nueva.recetaId}
                onValueChange={(v) => {
                  const receta = recetas.find((r) => r.id === v);
                  setNueva({
                    ...nueva,
                    recetaId: v,
                    precioUnitario: receta ? calcularPrecio(receta, ingredientes).precioVentaSugerido : 0,
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {recetas.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Cantidad entregada</label>
                <Input type="number" min={1} value={nueva.cantidadEntregada} onChange={(e) => setNueva({ ...nueva, cantidadEntregada: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <label className="text-sm font-medium">Precio unitario ($)</label>
                <Input type="number" min={0} value={nueva.precioUnitario} onChange={(e) => setNueva({ ...nueva, precioUnitario: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de entrega</label>
              <Input type="date" value={nueva.fechaEntrega} onChange={(e) => setNueva({ ...nueva, fechaEntrega: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCrear}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pagoOpen} onOpenChange={() => setPagoOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar venta y pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Unidades vendidas</label>
              <Input type="number" min={0} value={pago.vendidas} onChange={(e) => setPago({ ...pago, vendidas: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Monto recibido ($)</label>
              <Input type="number" min={0} value={pago.monto} onChange={(e) => setPago({ ...pago, monto: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Forma de pago</label>
              <Select value={pago.formaPago} onValueChange={(v) => setPago({ ...pago, formaPago: v as FormaPago })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGO.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagoOpen(null)}>Cancelar</Button>
            <Button onClick={handlePago}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar consignación?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) eliminarConsignacion(deleteId); setDeleteId(null); }} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
