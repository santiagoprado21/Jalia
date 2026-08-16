import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIngredientes } from "@/hooks/use-data";
import { formatMoneda } from "@/lib/moneda";
import { UNIDADES, type Ingrediente } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  unidad: z.enum(["kg", "g", "l", "ml", "pza", "taza"]),
  costoTotal: z.coerce.number().positive("Debe ser mayor a 0"),
  cantidadTotal: z.coerce.number().positive("Debe ser mayor a 0"),
});

type FormValues = z.infer<typeof schema>;

export default function Ingredientes() {
  const { ingredientes, agregarIngrediente, actualizarIngrediente, eliminarIngrediente } = useIngredientes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      unidad: "kg",
      costoTotal: 0,
      cantidadTotal: 0,
    },
  });

  const watchCosto = form.watch("costoTotal");
  const watchCantidad = form.watch("cantidadTotal");
  const costoPorUnidad = watchCantidad > 0 ? watchCosto / watchCantidad : 0;

  function openNew() {
    setEditingId(null);
    form.reset({ nombre: "", unidad: "kg", costoTotal: 0, cantidadTotal: 0 });
    setDialogOpen(true);
  }

  function openEdit(ing: Ingrediente) {
    setEditingId(ing.id);
    form.reset({
      nombre: ing.nombre,
      unidad: ing.unidad,
      costoTotal: ing.costoTotal,
      cantidadTotal: ing.cantidadTotal,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: FormValues) {
    if (editingId) {
      actualizarIngrediente(editingId, values);
    } else {
      agregarIngrediente(values);
    }
    setDialogOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Ingredientes</h2>
          <p className="text-muted-foreground mt-1">
            {ingredientes.length === 0
              ? "Agrega tus ingredientes con sus costos."
              : `${ingredientes.length} ingrediente${ingredientes.length !== 1 ? "s" : ""} registrado${ingredientes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={openNew} data-testid="button-nuevo-ingrediente" className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Ingrediente
        </Button>
      </div>

      {ingredientes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
          data-testid="empty-ingredientes"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
            Sin ingredientes todavia
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Registra los ingredientes que usas con su precio para poder calcular el costo de tus recetas.
          </p>
          <Button onClick={openNew} data-testid="button-agregar-primer-ingrediente" className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar primer ingrediente
          </Button>
        </motion.div>
      )}

      {ingredientes.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {ingredientes.map((ing, i) => (
              <motion.div
                key={ing.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.04 }}
                data-testid={`row-ingrediente-${ing.id}`}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{ing.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoneda(ing.costoTotal)} por {ing.cantidadTotal} {ing.unidad}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Costo por {ing.unidad}</p>
                    <p className="font-semibold text-primary text-sm" data-testid={`text-costo-unidad-${ing.id}`}>
                      {formatMoneda(ing.costoPorUnidad)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(ing)}
                      data-testid={`button-editar-ingrediente-${ing.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(ing.id)}
                      data-testid={`button-eliminar-ingrediente-${ing.id}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Editar Ingrediente" : "Nuevo Ingrediente"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Harina, Mantequilla..."
                        data-testid="input-nombre-ingrediente"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de medida</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unidad-ingrediente">
                          <SelectValue placeholder="Selecciona unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIDADES.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="cantidadTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad del paquete</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1"
                          data-testid="input-cantidad-ingrediente"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costoTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio del paquete ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-costo-ingrediente"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {costoPorUnidad > 0 && (
                <div className="bg-primary/10 rounded-lg p-3 text-sm">
                  <span className="text-muted-foreground">Costo por {form.watch("unidad")}: </span>
                  <span className="font-semibold text-primary">
                    {formatMoneda(costoPorUnidad)}
                  </span>
                </div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancelar-ingrediente"
                >
                  Cancelar
                </Button>
                <Button type="submit" data-testid="button-guardar-ingrediente">
                  {editingId ? "Guardar cambios" : "Agregar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ingrediente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El ingrediente se eliminara permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-eliminar">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) eliminarIngrediente(deleteId);
                setDeleteId(null);
              }}
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
