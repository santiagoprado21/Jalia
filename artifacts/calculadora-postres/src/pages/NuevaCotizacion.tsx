import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, FileDown } from "lucide-react";
import { Link } from "wouter";
import { useCotizaciones, useRecetas, useIngredientes, calcularPrecio } from "@/hooks/use-data";
import { formatMoneda } from "@/lib/moneda";
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
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  nombreCliente: z.string().min(1, "El nombre del cliente es obligatorio"),
  telefono: z.string().optional(),
  fechaEntrega: z.string().optional(),
  notas: z.string().optional(),
  items: z.array(
    z.object({
      recetaId: z.string().min(1, "Selecciona un postre"),
      cantidad: z.coerce.number().min(1, "Minimo 1"),
    })
  ).min(1, "Agrega al menos un postre"),
});

type FormValues = z.infer<typeof schema>;

export default function NuevaCotizacion() {
  const [, setLocation] = useLocation();
  const { agregarCotizacion } = useCotizaciones();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombreCliente: "",
      telefono: "",
      fechaEntrega: "",
      notas: "",
      items: [{ recetaId: "", cantidad: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const values = form.watch();

  const resumen = values.items.map((item) => {
    const receta = recetas.find((r) => r.id === item.recetaId);
    if (!receta || !item.cantidad) return null;
    const calc = calcularPrecio(receta, ingredientes);
    return {
      nombre: receta.nombre,
      precioUnit: calc.precioVentaSugerido,
      cantidad: item.cantidad,
      subtotal: calc.precioVentaSugerido * item.cantidad,
    };
  }).filter(Boolean) as { nombre: string; precioUnit: number; cantidad: number; subtotal: number }[];

  const total = resumen.reduce((s, r) => s + r.subtotal, 0);

  function onSubmit(values: FormValues) {
    const nueva = agregarCotizacion({
      nombreCliente: values.nombreCliente,
      telefono: values.telefono,
      fechaEntrega: values.fechaEntrega,
      notas: values.notas,
      items: values.items,
      estado: "pendiente",
    });
    setLocation(`/cotizacion/${nueva.id}`);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cotizaciones">
          <Button variant="ghost" size="icon" data-testid="button-volver">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Nueva Cotizacion</h2>
          <p className="text-muted-foreground mt-1">Arma el presupuesto de tu cliente</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Client info */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Datos del cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nombreCliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Maria Lopez" data-testid="input-nombre-cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="telefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="55 1234 5678" data-testid="input-telefono-cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fechaEntrega"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de entrega (opcional)</FormLabel>
                          <FormControl>
                            <Input type="date" data-testid="input-fecha-entrega" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Sabor, decoracion, indicaciones de entrega..."
                            data-testid="textarea-notas"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-serif text-lg">Postres del pedido</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ recetaId: "", cantidad: 1 })}
                    data-testid="button-agregar-item"
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent>
                  {recetas.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <p>Primero crea recetas en </p>
                      <Link href="/nueva-receta" className="text-primary underline">
                        Nueva Receta
                      </Link>
                    </div>
                  )}
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.recetaId`}
                          render={({ field: f }) => (
                            <FormItem className="flex-1">
                              {index === 0 && <FormLabel>Postre</FormLabel>}
                              <Select onValueChange={f.onChange} value={f.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-postre-${index}`}>
                                    <SelectValue placeholder="Selecciona postre..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {recetas.map((r) => {
                                    const c = calcularPrecio(r, ingredientes);
                                    return (
                                      <SelectItem key={r.id} value={r.id}>
                                        {r.nombre} — {formatMoneda(c.precioVentaSugerido)}/pieza
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.cantidad`}
                          render={({ field: f }) => (
                            <FormItem className="w-24">
                              {index === 0 && <FormLabel>Cantidad</FormLabel>}
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="1"
                                  data-testid={`input-cantidad-item-${index}`}
                                  {...f}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            data-testid={`button-quitar-item-${index}`}
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

              <Button type="submit" className="w-full gap-2" data-testid="button-guardar-cotizacion">
                <FileDown className="w-4 h-4" />
                Guardar cotizacion
              </Button>
            </div>

            {/* Live summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {resumen.length === 0 && (
                      <p className="text-sm text-muted-foreground">Agrega postres para ver el resumen.</p>
                    )}
                    {resumen.map((r, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate pr-2">
                          {r.cantidad}x {r.nombre}
                        </span>
                        <span className="font-medium shrink-0">{formatMoneda(r.subtotal)}</span>
                      </div>
                    ))}
                    {resumen.length > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-semibold text-foreground">Total</span>
                          <span className="font-bold text-primary text-lg" data-testid="calc-total-cotizacion">
                            {formatMoneda(total)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                          Precio por pieza segun el margen de cada receta.
                        </p>
                      </>
                    )}
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
