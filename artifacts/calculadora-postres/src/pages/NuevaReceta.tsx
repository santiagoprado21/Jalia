import { useState } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, Calculator } from "lucide-react";
import { Link } from "wouter";
import { useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { formatMoneda } from "@/lib/moneda";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIAS } from "@/types";
import type { VarianteReceta } from "@/types";
import VariantesEditor from "@/components/VariantesEditor";
import PrecioDesglose from "@/components/PrecioDesglose";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.string().min(1, "Selecciona una categoria"),
  porciones: z.coerce.number().min(1, "Debe producir al menos 1 porcion"),
  costosFijos: z.coerce.number().min(0),
  costosVariables: z.coerce.number().min(0),
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

export default function NuevaReceta() {
  const [, setLocation] = useLocation();
  const { agregarReceta } = useRecetas();
  const { ingredientes } = useIngredientes();
  const { toast } = useToast();
  const [variantes, setVariantes] = useState<VarianteReceta[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      categoria: "",
      porciones: 1,
      costosFijos: 0,
      costosVariables: 0,
      margenGanancia: 30,
      margenMayorista: 0,
      ingredientesReceta: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredientesReceta",
  });

  const values = form.watch();

  const calcLive = () => {
    const partial = {
      id: "",
      nombre: values.nombre,
      categoria: values.categoria,
      porciones: values.porciones || 1,
      ingredientesReceta: values.ingredientesReceta,
      costosFijos: values.costosFijos || 0,
      costosVariables: values.costosVariables || 0,
      margenGanancia: values.margenGanancia || 0,
      margenMayorista: values.margenMayorista || 0,
      fechaCreacion: "",
    };
    return calcularPrecio(partial, ingredientes);
  };

  const calc = calcLive();

  const recetaBase = {
    id: "", nombre: values.nombre, categoria: values.categoria,
    porciones: values.porciones || 1, ingredientesReceta: values.ingredientesReceta,
    costosFijos: values.costosFijos || 0, costosVariables: values.costosVariables || 0, margenGanancia: values.margenGanancia || 0,
    fechaCreacion: "", variantes,
  };

  function onSubmit(values: FormValues) {
    agregarReceta({ ...values, variantes });
    toast({
      title: "✅ Receta guardada",
      description: `"${values.nombre}" ya aparece en Mis Recetas.`,
    });
    setLocation("/");
  }

  function getIngredienteUnidad(id: string) {
    return ingredientes.find((i) => i.id === id)?.unidad ?? "";
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-volver">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Nueva Receta</h2>
          <p className="text-muted-foreground mt-1">Calcula el precio justo para tu postre</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
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
                            placeholder="Ej. Pastel de Chocolate, Flan Napolitano..."
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-categoria-receta">
                                <SelectValue placeholder="Selecciona..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIAS.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
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
                      name="porciones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porciones que rinde</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="12"
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
                  {ingredientes.length > 0 && (
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
                  {ingredientes.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <p>Primero agrega ingredientes en la seccion</p>
                      <Link href="/ingredientes" className="text-primary underline">
                        Ingredientes
                      </Link>
                    </div>
                  )}

                  {ingredientes.length > 0 && fields.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground text-sm mb-3">
                        Agrega los ingredientes que usas en esta receta
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ ingredienteId: "", cantidad: 0 })}
                        data-testid="button-primer-ingrediente-receta"
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar ingrediente
                      </Button>
                    </div>
                  )}

                  <ScrollArea className="max-h-72 pr-3">
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`ingredientesReceta.${index}.ingredienteId`}
                          render={({ field: f }) => (
                            <FormItem className="flex-1">
                              {index === 0 && <FormLabel>Ingrediente</FormLabel>}
                              <Select onValueChange={f.onChange} value={f.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-ingrediente-${index}`}>
                                    <SelectValue placeholder="Selecciona..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ingredientes.map((ing) => (
                                    <SelectItem key={ing.id} value={ing.id}>
                                      {ing.nombre} ({formatMoneda(ing.costoPorUnidad)}/{ing.unidad})
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
                                  Cantidad ({getIngredienteUnidad(form.watch(`ingredientesReceta.${index}.ingredienteId`)) || "unid."})
                                </FormLabel>
                              )}
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.001"
                                  placeholder="0"
                                  data-testid={`input-cantidad-receta-${index}`}
                                  {...f}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          data-testid={`button-quitar-ingrediente-${index}`}
                          className="mb-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <VariantesEditor
                variantes={variantes}
                onChange={setVariantes}
                ingredientes={ingredientes}
                recetaBase={recetaBase}
              />

              {/* Costs & margin */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Costos y margen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="costosFijos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gastos fijos ($)</FormLabel>
                          <p className="text-xs text-muted-foreground -mt-1">
                            Empaque, gas, luz, transporte
                          </p>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="0"
                              data-testid="input-costos-fijos"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="costosVariables"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gastos variables ($)</FormLabel>
                          <p className="text-xs text-muted-foreground -mt-1">
                            Decoración, toppings, extras por lote
                          </p>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="0"
                              data-testid="input-costos-variables"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                              placeholder="30"
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
                              placeholder="0"
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

              <Button
                type="submit"
                className="w-full gap-2"
                data-testid="button-guardar-receta"
              >
                <Calculator className="w-4 h-4" />
                Guardar receta
              </Button>
            </div>

            {/* Live price panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      Calculo en vivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PrecioDesglose
                      calc={calc}
                      margenGanancia={values.margenGanancia || 0}
                      margenMayorista={values.margenMayorista || 0}
                    />
                    <p className="text-xs text-muted-foreground pt-3">
                      El precio se actualiza automáticamente mientras llenas el formulario.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
