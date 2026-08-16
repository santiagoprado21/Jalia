import { useParams, useLocation, Link } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useVentas, useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { formatFecha } from "@/lib/semana";
import { formatMoneda, redondearPrecio } from "@/lib/moneda";
import { FORMAS_PAGO } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  notas: z.string().optional(),
  items: z.array(
    z.object({
      recetaId: z.string().min(1, "Selecciona un postre"),
      cantidad: z.coerce.number().min(1, "Mínimo 1"),
      precioVenta: z.coerce.number().min(0, "Precio inválido"),
      formaPago: z.enum(["efectivo", "nequi", "llave"]).default("efectivo"),
    })
  ).min(1, "Agrega al menos un postre vendido"),
});

type FormValues = z.infer<typeof schema>;

export default function RegistrarVenta() {
  const params = useParams<{ fecha: string }>();
  const [, setLocation] = useLocation();
  const { getVentaPorFecha, guardarVenta } = useVentas();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();

  const fecha = params.fecha;
  const ventaExistente = getVentaPorFecha(fecha);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: ventaExistente
      ? {
          notas: ventaExistente.notas ?? "",
          items: ventaExistente.items.map((item) => ({
            ...item,
            formaPago: item.formaPago ?? "efectivo",
          })),
        }
      : {
          notas: "",
          items: [{ recetaId: "", cantidad: 1, precioVenta: 0, formaPago: "efectivo" }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const values = form.watch();

  function getPrecioSugerido(recetaId: string) {
    const receta = recetas.find((r) => r.id === recetaId);
    if (!receta) return 0;
    return calcularPrecio(receta, ingredientes).precioVentaSugerido;
  }

  function getCostoPorcion(recetaId: string) {
    const receta = recetas.find((r) => r.id === recetaId);
    if (!receta) return 0;
    return calcularPrecio(receta, ingredientes).costoPorPorcion;
  }

  const resumen = values.items.map((item) => {
    if (!item.recetaId || !item.cantidad) return null;
    const costo = getCostoPorcion(item.recetaId) * item.cantidad;
    const ingreso = redondearPrecio(item.precioVenta) * item.cantidad;
    return { ingreso, costo, ganancia: ingreso - costo, unidades: item.cantidad };
  }).filter(Boolean) as { ingreso: number; costo: number; ganancia: number; unidades: number }[];

  const totales = resumen.reduce(
    (a, r) => ({ ingreso: a.ingreso + r.ingreso, costo: a.costo + r.costo, ganancia: a.ganancia + r.ganancia, unidades: a.unidades + r.unidades }),
    { ingreso: 0, costo: 0, ganancia: 0, unidades: 0 }
  );

  const pagos = values.items.reduce(
    (acc, item) => {
      if (!item.recetaId || !item.cantidad) return acc;
      const forma = item.formaPago ?? "efectivo";
      acc[forma] += redondearPrecio(item.precioVenta) * item.cantidad;
      return acc;
    },
    { efectivo: 0, nequi: 0, llave: 0 }
  );

  function onSubmit(values: FormValues) {
    guardarVenta({
      fecha,
      items: values.items.map((item) => ({
        ...item,
        precioVenta: redondearPrecio(item.precioVenta),
        formaPago: item.formaPago ?? "efectivo",
      })),
      notas: values.notas,
    });
    setLocation("/caja");
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/caja">
          <Button variant="ghost" size="icon" data-testid="button-volver">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">
            {ventaExistente ? "Editar cuadre" : "Registrar cuadre"}
          </h2>
          <p className="text-muted-foreground mt-1 capitalize">{formatFecha(fecha)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Puedes registrar aquí las ventas del fin de semana u otro periodo en la fecha que elijas.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-serif text-lg">Postres vendidos</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ recetaId: "", cantidad: 1, precioVenta: 0, formaPago: "efectivo" })}
                    data-testid="button-agregar-item-venta"
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  {recetas.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      <p>Primero crea recetas.</p>
                      <Link href="/nueva-receta" className="text-primary underline">Nueva Receta</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => {
                        const recetaId = form.watch(`items.${index}.recetaId`);
                        const precioSugerido = getPrecioSugerido(recetaId);

                        return (
                          <div key={field.id} className="p-3 bg-muted/40 rounded-xl space-y-3">
                            <div className="flex items-start gap-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.recetaId`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel className="text-xs">Postre</FormLabel>
                                    <Select
                                      onValueChange={(v) => {
                                        f.onChange(v);
                                        const sugerido = getPrecioSugerido(v);
                                        if (sugerido > 0) {
                                          form.setValue(`items.${index}.precioVenta`, sugerido);
                                        }
                                      }}
                                      value={f.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger data-testid={`select-postre-venta-${index}`}>
                                          <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {recetas.map((r) => (
                                          <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                                data-testid={`button-quitar-item-venta-${index}`}
                                className="mt-5 text-muted-foreground hover:text-destructive shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.cantidad`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Cantidad</FormLabel>
                                    <FormControl>
                                      <Input type="number" min={1} data-testid={`input-cantidad-venta-${index}`} {...f} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.precioVenta`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Precio ($)
                                      {precioSugerido > 0 && (
                                        <span className="ml-1 text-primary font-normal">
                                          — lista: {formatMoneda(precioSugerido)}
                                        </span>
                                      )}
                                    </FormLabel>
                                    <FormControl>
                                      <Input type="number" step="1" min={0} data-testid={`input-precio-venta-${index}`} {...f} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.formaPago`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Forma de pago</FormLabel>
                                    <Select onValueChange={f.onChange} value={f.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid={`select-pago-venta-${index}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {FORMAS_PAGO.map(({ value, label }) => (
                                          <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <FormField
                    control={form.control}
                    name="notas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas del cuadre (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej. ventas del sábado y domingo, descuentos, gastos extra..."
                            rows={2}
                            data-testid="textarea-notas-venta"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" className="w-full gap-2" data-testid="button-guardar-venta">
                <Save className="w-4 h-4" />
                Guardar cuadre
              </Button>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Cuadre del día</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unidades vendidas</span>
                      <span className="font-semibold" data-testid="calc-unidades">{totales.unidades}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ingresos</span>
                      <span className="font-semibold text-primary" data-testid="calc-ingresos">
                        {formatMoneda(totales.ingreso)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo estimado</span>
                      <span className="font-semibold text-orange-600" data-testid="calc-costo">
                        {formatMoneda(totales.costo)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Ganancia neta</span>
                      <span
                        className={`font-bold text-lg ${totales.ganancia >= 0 ? "text-green-700" : "text-destructive"}`}
                        data-testid="calc-ganancia"
                      >
                        {formatMoneda(totales.ganancia)}
                      </span>
                    </div>
                    {totales.ingreso > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Margen real</span>
                        <span className="font-medium">
                          {Math.round((totales.ganancia / totales.ingreso) * 100)}%
                        </span>
                      </div>
                    )}
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground">Por forma de pago</p>
                    {FORMAS_PAGO.map(({ value, label }) => (
                      <div key={value} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{formatMoneda(pagos[value])}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">
                      El precio sugerido coincide con la lista de Mis Recetas.
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
