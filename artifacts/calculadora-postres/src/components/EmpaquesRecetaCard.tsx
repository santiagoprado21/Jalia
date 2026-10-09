import { useState } from "react";
import { useFieldArray, type ArrayPath, type Control, type FieldArray, type Path } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useEmpaques } from "@/hooks/use-data";
import { formatMoneda } from "@/lib/moneda";
import EmpaqueDialog from "@/components/EmpaqueDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface EmpaquesFormFields {
  empaques: { empaqueId: string; cantidad: number }[];
  costoEmpaqueOtro: number;
}

interface Props<T extends EmpaquesFormFields> {
  control: Control<T>;
  porciones: number;
  /** Costo de empaque de todo el lote (por porción × porciones). */
  costoTotal: number;
  /** El campo manual solo se muestra en recetas que ya lo usaban. */
  mostrarOtro: boolean;
  disabled?: boolean;
}

export default function EmpaquesRecetaCard<T extends EmpaquesFormFields>({
  control,
  porciones,
  costoTotal,
  mostrarOtro,
  disabled,
}: Props<T>) {
  const { empaques: catalogo } = useEmpaques();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "empaques" as ArrayPath<T>,
  });

  function agregar(empaqueId = "") {
    append({ empaqueId, cantidad: 1 } as FieldArray<T, ArrayPath<T>>);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="font-serif text-lg">Empaques</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Caja, bolsa o vasito que lleva cada porción</p>
        </div>
        {!disabled && (
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(true)} className="gap-1">
              <Plus className="w-3 h-3" />
              Crear
            </Button>
            {catalogo.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => agregar()} className="gap-1" data-testid="button-agregar-empaque-receta">
                <Plus className="w-3 h-3" />
                Agregar
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {catalogo.length === 0 && !disabled && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Todavía no tienes empaques. Usa <span className="font-medium text-foreground">Crear</span> para
            agregar el primero; luego podrás elegirlo en cualquier receta.
          </p>
        )}
        {fields.length === 0 && disabled && !mostrarOtro && (
          <p className="text-sm text-muted-foreground text-center py-2">Esta receta no tiene empaques.</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <FormField
              control={control}
              name={`empaques.${index}.empaqueId` as Path<T>}
              render={({ field: f }) => (
                <FormItem className="flex-1 min-w-0">
                  {index === 0 && <FormLabel>Empaque</FormLabel>}
                  <Select onValueChange={f.onChange} value={f.value as string} disabled={disabled}>
                    <FormControl>
                      <SelectTrigger data-testid={`select-empaque-${index}`}>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {catalogo.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nombre} ({formatMoneda(emp.costo)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`empaques.${index}.cantidad` as Path<T>}
              render={({ field: f }) => (
                <FormItem className="w-24">
                  {index === 0 && <FormLabel>Por porción</FormLabel>}
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      disabled={disabled}
                      data-testid={`input-cantidad-empaque-${index}`}
                      {...f}
                      value={f.value as number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        {mostrarOtro && (
          <FormField
            control={control}
            name={"costoEmpaqueOtro" as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Otro empaque por porción ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} disabled={disabled} {...field} value={field.value as number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {costoTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatMoneda(costoTotal / (porciones || 1))} por porción × {porciones || 1} porciones ={" "}
            <span className="font-medium text-foreground">{formatMoneda(costoTotal)}</span>
          </p>
        )}
      </CardContent>

      <EmpaqueDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={(emp) => agregar(emp.id)} />
    </Card>
  );
}
