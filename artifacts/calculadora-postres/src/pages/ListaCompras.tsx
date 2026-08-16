import { useState } from "react";
import { Link } from "wouter";
import { Plus, Trash2, ShoppingCart, Check, Sparkles } from "lucide-react";
import {
  useListaCompras,
  useRecetas,
  useIngredientes,
  generarListaComprasDesdeRecetas,
} from "@/hooks/use-data";
import { UNIDADES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ListaCompras() {
  const { items, agregarItem, toggleComprado, eliminarItem, limpiarComprados, reemplazarItems } = useListaCompras();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [generarOpen, setGenerarOpen] = useState(false);
  const [recetasSeleccionadas, setRecetasSeleccionadas] = useState<string[]>([]);
  const [nuevo, setNuevo] = useState({ nombre: "", cantidad: 1, unidad: "kg" as const, notas: "" });

  const pendientes = items.filter((i) => !i.comprado);
  const comprados = items.filter((i) => i.comprado);

  function handleAgregarManual() {
    if (!nuevo.nombre.trim()) return;
    agregarItem({
      nombre: nuevo.nombre.trim(),
      cantidad: nuevo.cantidad,
      unidad: nuevo.unidad,
      notas: nuevo.notas || undefined,
    });
    setNuevo({ nombre: "", cantidad: 1, unidad: "kg", notas: "" });
    setDialogOpen(false);
  }

  function toggleReceta(id: string) {
    setRecetasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function generarDesdeRecetas() {
    const generados = generarListaComprasDesdeRecetas(recetas, recetasSeleccionadas, ingredientes);
    const nuevosItems = generados.map((g) => ({
      ...g,
      id: crypto.randomUUID(),
      comprado: false,
    }));
    reemplazarItems([...items.filter((i) => !i.comprado), ...nuevosItems]);
    setGenerarOpen(false);
    setRecetasSeleccionadas([]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Lista de compras</h2>
          <p className="text-muted-foreground mt-1">
            {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
            {comprados.length > 0 && ` · ${comprados.length} comprado${comprados.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          {comprados.length > 0 && (
            <Button variant="outline" onClick={limpiarComprados} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Limpiar comprados
            </Button>
          )}
          <Button variant="outline" onClick={() => setGenerarOpen(true)} className="gap-2" disabled={recetas.length === 0}>
            <Sparkles className="w-4 h-4" />
            Desde recetas
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar item
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <ShoppingCart className="w-12 h-12 text-primary/40 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold mb-2">Tu lista está vacía</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Agrega items manualmente o genera la lista a partir de tus recetas.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setGenerarOpen(true)} disabled={recetas.length === 0}>
                Desde recetas
              </Button>
              <Button onClick={() => setDialogOpen(true)}>Agregar item</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendientes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Por comprar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendientes.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20">
                    <Checkbox
                      checked={item.comprado}
                      onCheckedChange={() => toggleComprado(item.id)}
                      data-testid={`check-item-${item.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.cantidad} {item.unidad}
                        {item.notas && ` · ${item.notas}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => eliminarItem(item.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {comprados.length > 0 && (
            <Card className="opacity-80">
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Comprados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {comprados.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <Checkbox checked onCheckedChange={() => toggleComprado(item.id)} />
                    <div className="flex-1 line-through text-muted-foreground">
                      {item.nombre} — {item.cantidad} {item.unidad}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => eliminarItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a la lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Producto</label>
              <Input
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                placeholder="Ej. Harina, mantequilla..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Cantidad</label>
                <Input
                  type="number"
                  min={0.001}
                  step="0.001"
                  value={nuevo.cantidad}
                  onChange={(e) => setNuevo({ ...nuevo, cantidad: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Unidad</label>
                <Select value={nuevo.unidad} onValueChange={(v) => setNuevo({ ...nuevo, unidad: v as typeof nuevo.unidad })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Input
                value={nuevo.notas}
                onChange={(e) => setNuevo({ ...nuevo, notas: e.target.value })}
                placeholder="Marca, tienda..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAgregarManual}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generarOpen} onOpenChange={setGenerarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar lista desde recetas</DialogTitle>
          </DialogHeader>
          {recetas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Primero crea recetas. <Link href="/nueva-receta" className="text-primary underline">Nueva receta</Link>
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto py-2">
              {recetas.map((r) => (
                <label key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
                  <Checkbox
                    checked={recetasSeleccionadas.includes(r.id)}
                    onCheckedChange={() => toggleReceta(r.id)}
                  />
                  <span className="text-sm">{r.nombre}</span>
                </label>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerarOpen(false)}>Cancelar</Button>
            <Button onClick={generarDesdeRecetas} disabled={recetasSeleccionadas.length === 0}>
              Generar lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
