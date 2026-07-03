import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { VarianteReceta, IngredienteReceta, Ingrediente, Receta } from "@/types";
import { calcularPrecioVariante } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  variantes: VarianteReceta[];
  onChange: (variantes: VarianteReceta[]) => void;
  ingredientes: Ingrediente[];
  recetaBase: Receta;
  disabled?: boolean;
}

const formatMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export default function VariantesEditor({ variantes, onChange, ingredientes, recetaBase, disabled }: Props) {
  const [expandida, setExpandida] = useState<string | null>(null);

  function agregarVariante() {
    const nueva: VarianteReceta = {
      id: crypto.randomUUID(),
      nombre: "",
      ingredientesExtra: [],
    };
    const nuevas = [...variantes, nueva];
    onChange(nuevas);
    setExpandida(nueva.id);
  }

  function eliminarVariante(id: string) {
    onChange(variantes.filter((v) => v.id !== id));
    if (expandida === id) setExpandida(null);
  }

  function actualizarNombre(id: string, nombre: string) {
    onChange(variantes.map((v) => (v.id === id ? { ...v, nombre } : v)));
  }

  function actualizarPorciones(id: string, porcionesVariante: number) {
    onChange(variantes.map((v) => (v.id === id ? { ...v, porcionesVariante } : v)));
  }

  function agregarIngredienteExtra(varianteId: string) {
    onChange(
      variantes.map((v) =>
        v.id === varianteId
          ? { ...v, ingredientesExtra: [...v.ingredientesExtra, { ingredienteId: "", cantidad: 0 }] }
          : v
      )
    );
  }

  function actualizarIngredienteExtra(
    varianteId: string,
    index: number,
    field: keyof IngredienteReceta,
    value: string | number
  ) {
    onChange(
      variantes.map((v) => {
        if (v.id !== varianteId) return v;
        const extras = v.ingredientesExtra.map((ie, i) =>
          i === index ? { ...ie, [field]: value } : ie
        );
        return { ...v, ingredientesExtra: extras };
      })
    );
  }

  function eliminarIngredienteExtra(varianteId: string, index: number) {
    onChange(
      variantes.map((v) => {
        if (v.id !== varianteId) return v;
        return { ...v, ingredientesExtra: v.ingredientesExtra.filter((_, i) => i !== index) };
      })
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-serif text-lg">Sabores / Variantes</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cada variante agrega ingredientes extra a la base y calcula su propio precio
          </p>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarVariante}
            className="gap-1 shrink-0"
            data-testid="button-agregar-variante"
          >
            <Plus className="w-3 h-3" />
            Agregar sabor
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {variantes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {disabled
              ? "Sin variantes registradas."
              : "Agrega un sabor para ver cómo cambia el precio al agregar salsa u otros extras."}
          </p>
        ) : (
          <div className="space-y-3">
            {variantes.map((variante, vi) => {
              const calc = calcularPrecioVariante(recetaBase, variante.ingredientesExtra, variante.porcionesVariante, ingredientes);
              const abierta = expandida === variante.id;

              return (
                <motion.div
                  key={variante.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-xl overflow-hidden"
                  data-testid={`variante-card-${vi}`}
                >
                  {/* Variante header row */}
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer select-none"
                    onClick={() => setExpandida(abierta ? null : variante.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {abierta ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {variante.nombre || <span className="text-muted-foreground italic">Sin nombre</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {variante.ingredientesExtra.length} ingrediente(s) extra
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Precio c/variante</p>
                        <p className="font-bold text-primary text-sm">{formatMXN(calc.precioVentaSugerido)}</p>
                      </div>
                      {!disabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); eliminarVariante(variante.id); }}
                          className="text-muted-foreground hover:text-destructive"
                          data-testid={`button-eliminar-variante-${vi}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {abierta && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-4 space-y-4">
                          {/* Nombre + porciones */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Nombre del sabor / variante</Label>
                              <Input
                                placeholder="Ej. Salsa de fresa, Salsa de mango..."
                                value={variante.nombre}
                                disabled={disabled}
                                onChange={(e) => actualizarNombre(variante.id, e.target.value)}
                                data-testid={`input-nombre-variante-${vi}`}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                ¿Para cuántos postres alcanza esta salsa?
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                placeholder={`Ej. ${recetaBase.porciones} (igual que la base)`}
                                value={variante.porcionesVariante ?? ""}
                                disabled={disabled}
                                onChange={(e) =>
                                  actualizarPorciones(variante.id, parseInt(e.target.value) || 0)
                                }
                                data-testid={`input-porciones-variante-${vi}`}
                              />
                              <p className="text-xs text-muted-foreground">
                                Si dejas vacío, usa las {recetaBase.porciones} porciones de la base
                              </p>
                            </div>
                          </div>

                          {/* Extra ingredients */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Ingredientes extra de esta variante</Label>
                              {!disabled && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => agregarIngredienteExtra(variante.id)}
                                  className="h-7 text-xs gap-1"
                                  data-testid={`button-agregar-ing-variante-${vi}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  Agregar
                                </Button>
                              )}
                            </div>

                            {variante.ingredientesExtra.length === 0 && (
                              <p className="text-xs text-muted-foreground py-2 text-center">
                                {disabled ? "Sin ingredientes extra." : "Agrega los ingredientes de la salsa u extras de esta variante."}
                              </p>
                            )}

                            <div className="space-y-2">
                              {variante.ingredientesExtra.map((ie, idx) => {
                                const ing = ingredientes.find((i) => i.id === ie.ingredienteId);
                                return (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Select
                                      value={ie.ingredienteId}
                                      disabled={disabled}
                                      onValueChange={(v) =>
                                        actualizarIngredienteExtra(variante.id, idx, "ingredienteId", v)
                                      }
                                    >
                                      <SelectTrigger
                                        className="flex-1 h-8 text-xs"
                                        data-testid={`select-ing-variante-${vi}-${idx}`}
                                      >
                                        <SelectValue placeholder="Ingrediente..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {ingredientes.map((i) => (
                                          <SelectItem key={i.id} value={i.id}>
                                            {i.nombre} ({formatMXN(i.costoPorUnidad)}/{i.unidad})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      step="0.001"
                                      min={0}
                                      placeholder="Cant."
                                      disabled={disabled}
                                      value={ie.cantidad || ""}
                                      onChange={(e) =>
                                        actualizarIngredienteExtra(
                                          variante.id,
                                          idx,
                                          "cantidad",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-24 h-8 text-xs"
                                      data-testid={`input-cant-variante-${vi}-${idx}`}
                                    />
                                    <span className="text-xs text-muted-foreground w-8 shrink-0">
                                      {ing?.unidad ?? ""}
                                    </span>
                                    {!disabled && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => eliminarIngredienteExtra(variante.id, idx)}
                                        data-testid={`button-quitar-ing-variante-${vi}-${idx}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Price breakdown for this variant */}
                          <Separator />
                          {(() => {
                            const basePorciones = recetaBase.porciones || 1;
                            const extraPorciones = variante.porcionesVariante && variante.porcionesVariante > 0
                              ? variante.porcionesVariante : basePorciones;
                            const extraCostoTotal = variante.ingredientesExtra.reduce((sum, ir) => {
                              const ing = ingredientes.find((i) => i.id === ir.ingredienteId);
                              return sum + (ing ? ing.costoPorUnidad * ir.cantidad : 0);
                            }, 0);
                            const extraCostoPorPorcion = extraCostoTotal / extraPorciones;

                            return (
                              <div className="bg-primary/5 rounded-lg px-3 py-3 space-y-1.5 text-xs">
                                <p className="font-semibold text-foreground text-sm mb-2">
                                  Desglose — {variante.nombre || "esta variante"}
                                </p>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Costo base por porción</span>
                                  <span className="font-medium">
                                    {formatMXN((recetaBase.ingredientesReceta.reduce((s, ir) => {
                                      const ing = ingredientes.find(i => i.id === ir.ingredienteId);
                                      return s + (ing ? ing.costoPorUnidad * ir.cantidad : 0);
                                    }, 0)) / basePorciones)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Salsa por porción
                                    {variante.porcionesVariante ? ` (÷${extraPorciones})` : ""}
                                  </span>
                                  <span className="font-medium">{formatMXN(extraCostoPorPorcion)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Costos fijos por porción</span>
                                  <span className="font-medium">{formatMXN(recetaBase.costosFijos / basePorciones)}</span>
                                </div>
                                <Separator className="my-1" />
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Costo total por porción</span>
                                  <span className="font-medium">{formatMXN(calc.costoPorPorcion)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-sm pt-1">
                                  <span className="text-foreground">Precio de venta</span>
                                  <span className="text-primary">{formatMXN(calc.precioVentaSugerido)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
