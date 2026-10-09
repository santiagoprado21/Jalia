import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEmpaques } from "@/hooks/use-data";
import type { Empaque } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  costo: z.coerce.number().positive("Debe ser mayor a 0"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si viene, se edita ese empaque; si no, se crea uno nuevo. */
  empaque?: Empaque | null;
  onCreated?: (empaque: Empaque) => void;
}

export default function EmpaqueDialog({ open, onOpenChange, empaque, onCreated }: Props) {
  const { agregarEmpaque, actualizarEmpaque } = useEmpaques();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", costo: 0 },
  });

  useEffect(() => {
    if (open) form.reset(empaque ? { nombre: empaque.nombre, costo: empaque.costo } : { nombre: "", costo: 0 });
  }, [open, empaque, form]);

  function onSubmit(values: FormValues) {
    if (empaque) {
      actualizarEmpaque(empaque.id, values);
    } else {
      const nuevo = agregarEmpaque(values);
      onCreated?.(nuevo);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{empaque ? "Editar empaque" : "Nuevo empaque"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Caja 4 cupcakes, Vasito 9 oz..." data-testid="input-nombre-empaque" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo de cada uno ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} placeholder="0" data-testid="input-costo-empaque" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-guardar-empaque">
                {empaque ? "Guardar cambios" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
