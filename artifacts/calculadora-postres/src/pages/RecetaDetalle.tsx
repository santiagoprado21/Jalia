import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Calculator, Pencil } from "lucide-react";
import { Link } from "wouter";
import { useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { CATEGORIAS } from "@/types";
import type { VarianteReceta } from "@/types";
import VariantesEditor from "@/components/VariantesEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.string().min(1, "Selecciona una categoria"),
  porciones: z.coerce.number().min(1, "Debe producir al menos 1 porcion"),
  costosFijos: z.coerce.number().min(0),
  margenGanancia: z.coerce.number().min(0).max(1000),
  margenMayorista: z.coerce.number().min(0).max(1000),
  ingredientesReceta: z.array(
    z.object({
      ingredienteId: z.string().min(1, "Selecciona un ingrediente"),
      cantidad: z.coerce.number().positive("Cantidad invalida"),
    })
  ),
});

type FormValues = z.infer<typeof schema>;

export default function RecetaDetalle() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getReceta, actualizarReceta, eliminarReceta } = useRecetas();
  const { ingredientes } = useIngredientes();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const receta = getReceta(params.id);
  const [variantes, setVariantes] = useState<VarianteReceta[]>(receta?.variantes ?? []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: receta
      ? {
          nombre: receta.nombre,
          categoria: receta.categoria,
          porciones: receta.porciones,
          costosFijos: receta.costosFijos,
          margenGanancia: receta.margenGanancia,
          margenMayorista: receta.margenMayorista ?? 0,
          ingredientesReceta: receta.ingredientesReceta,
        }
      : {
          nombre: "",
          categoria: "",
          porciones: 1,
          costosFijos: 0,
          margenGanancia: 30,
          margenMayorista: 0,
          ingredientesReceta: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredientesReceta",
  });

  if (!receta) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Receta no encontrada.</p>
        <Link href="/">
          <Button className="mt-4" data-testid="button-volver-inicio">Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  const values = form.watch();

  const calcLive = () => {
    const partial = {
      id: receta.id,
      nombre: values.nombre,
      categoria: values.categoria,
      porciones: values.porciones || 1,
      ingredientesReceta: values.ingredientesReceta,
      costosFijos: values.costosFijos || 0,
      margenGanancia: values.margenGanancia || 0,
      margenMayorista: values.margenMayorista || 0,
      fechaCreacion: receta.fechaCreacion,
    };
    return calcularPrecio(partial, ingredientes);
  };

  const calc = editing ? calcLive() : calcularPrecio(receta, ingredientes);

  const formatMXN = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  const recetaBase = {
    ...receta,
    porciones: values.porciones || receta.porciones,
    ingredientesReceta: values.ingredientesReceta,
    costosFijos: values.costosFijos || 0,
    margenGanancia: values.margenGanancia || 0,
  };

  function onSubmit(values: FormValues) {
    actualizarReceta(receta.id, { ...values, variantes });
    setEditing(false);
  }

  function handleDelete() {
    eliminarReceta(receta.id);
    setLocation("/");
  }

  function getIngredienteUnidad(id: string) {
    return ingredientes.find((i) => i.id === id)?.unidad ?? "";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-volver">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground">{receta.nombre}</h2>
            <p className="text-muted-foreground mt-1">{receta.categoria} &middot; {receta.porciones} porciones</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                data-testid="button-editar-receta"
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                data-testid="button-eliminar-receta"
                className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic info */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Informacion general</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del postre</FormLabel>
                        <FormControl>
                          <Input
                            disabled={!editing}
                            data-testid="input-nombre-receta"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!editing}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-categoria-receta">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIAS.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="porciones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porciones que rinde</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              disabled={!editing}
                              data-testid="input-porciones-receta"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-serif text-lg">Ingredientes</CardTitle>
                  {editing && ingredientes.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ ingredienteId: "", cantidad: 0 })}
                      data-testid="button-agregar-ingrediente-receta"
                      className="gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {fields.length === 0 && !editing && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Esta receta no tiene ingredientes registrados.
                    </p>
                  )}
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`ingredientesReceta.${index}.ingredienteId`}
                          render={({ field: f }) => (
                            <FormItem className="flex-1">
                              {index === 0 && <FormLabel>Ingrediente</FormLabel>}
                              <Select
                                onValueChange={f.onChange}
                                value={f.value}
                                disabled={!editing}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid={`select-ingrediente-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ingredientes.map((ing) => (
                                    <SelectItem key={ing.id} value={ing.id}>
                                      {ing.nombre} ({formatMXN(ing.costoPorUnidad)}/{ing.unidad})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`ingredientesReceta.${index}.cantidad`}
                          render={({ field: f }) => (
                            <FormItem className="w-28">
                              {index === 0 && (
                                <FormLabel>
                                  Cant. ({getIngredienteUnidad(form.watch(`ingredientesReceta.${index}.ingredienteId`)) || "unid."})
                                </FormLabel>
                              )}
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.001"
                                  disabled={!editing}
                                  data-testid={`input-cantidad-receta-${index}`}
                                  {...f}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {editing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            data-testid={`button-quitar-ingrediente-${index}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Variants */}
              <VariantesEditor
                variantes={variantes}
                onChange={setVariantes}
                ingredientes={ingredientes}
                recetaBase={recetaBase}
                disabled={!editing}
              />

              {/* Costs & margin */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Costos y margen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="costosFijos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costos fijos ($)</FormLabel>
                        <p className="text-xs text-muted-foreground -mt-1">
                          Empaque, gas, luz, transporte
                        </p>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            disabled={!editing}
                            data-testid="input-costos-fijos"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="margenGanancia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Margen al detal (%)</FormLabel>
                          <p className="text-xs text-muted-foreground -mt-1">
                            Precio de venta individual
                          </p>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              min={0}
                              max={1000}
                              disabled={!editing}
                              data-testid="input-margen-ganancia"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="margenMayorista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Margen mayorista (%)</FormLabel>
                          <p className="text-xs text-muted-foreground -mt-1">
                            0 = no usar precio mayorista
                          </p>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              min={0}
                              max={1000}
                              disabled={!editing}
                              data-testid="input-margen-mayorista"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {editing && (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setEditing(false); form.reset(); }}
                    data-testid="button-cancelar-edicion"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    data-testid="button-guardar-cambios"
                  >
                    <Calculator className="w-4 h-4" />
                    Guardar cambios
                  </Button>
                </div>
              )}
            </div>

            {/* Price panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      Precio calculado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo ingredientes</span>
                      <span className="font-medium" data-testid="calc-costo-ingredientes">
                        {formatMXN(calc.costoIngredientes)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costos fijos</span>
                      <span className="font-medium" data-testid="calc-costos-fijos">
                        {formatMXN(calc.costoTotal - calc.costoIngredientes)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo total</span>
                      <span className="font-medium" data-testid="calc-costo-total">
                        {formatMXN(calc.costoTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo por porcion</span>
                      <span className="font-medium" data-testid="calc-costo-porcion">
                        {formatMXN(calc.costoPorPorcion)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Precio al detal</span>
                      <span
                        className="font-bold text-primary text-lg"
                        data-testid="calc-precio-sugerido"
                      >
                        {formatMXN(calc.precioVentaSugerido)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ganancia detal</span>
                      <span className="font-medium text-green-700" data-testid="calc-ganancia-total">
                        {formatMXN(calc.gananciaTotal)}
                      </span>
                    </div>
                    {calc.precioMayorista !== undefined && calc.precioMayorista > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-semibold text-foreground">Precio mayorista</span>
                          <span className="font-bold text-blue-700 text-lg" data-testid="calc-precio-mayorista">
                            {formatMXN(calc.precioMayorista)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ganancia mayorista</span>
                          <span className="font-medium text-blue-600">
                            {formatMXN(calc.gananciaMayorista ?? 0)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="bg-background rounded-lg p-3 mt-2">
                      <p className="text-xs text-muted-foreground">
                        Detal: <span className="font-semibold text-foreground">{editing ? (values.margenGanancia || 0) : receta.margenGanancia}%</span>
                        {((editing ? (values.margenMayorista || 0) : (receta.margenMayorista ?? 0)) > 0) && (
                          <> &nbsp;·&nbsp; Mayorista: <span className="font-semibold text-foreground">{editing ? (values.margenMayorista || 0) : receta.margenMayorista}%</span></>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar receta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La receta "{receta.nombre}" se eliminara permanentemente.
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
