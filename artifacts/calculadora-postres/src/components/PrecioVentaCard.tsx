import type { Control, FieldValues, Path } from "react-hook-form";
import { formatMoneda } from "@/lib/moneda";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Props<T extends FieldValues> {
  control: Control<T>;
  sugeridoDetal: number;
  sugeridoMayorista?: number;
  disabled?: boolean;
}

export default function PrecioVentaCard<T extends FieldValues>({
  control,
  sugeridoDetal,
  sugeridoMayorista,
  disabled,
}: Props<T>) {
  const campos = [
    {
      name: "precioVentaDetal" as Path<T>,
      label: "Precio de venta al detal ($)",
      sugerido: sugeridoDetal,
      testId: "input-precio-venta-detal",
    },
    {
      name: "precioVentaMayorista" as Path<T>,
      label: "Precio de venta mayorista ($)",
      sugerido: sugeridoMayorista && sugeridoMayorista > 0 ? sugeridoMayorista : sugeridoDetal,
      testId: "input-precio-venta-mayorista",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Precio de venta</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          El precio que realmente cobras. Es el que se usa al registrar ventas y en las cotizaciones.
          Si lo dejas vacío, se usa el precio sugerido.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campos.map(({ name, label, sugerido, testId }) => (
            <FormField
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Sugerido: <span className="font-medium text-foreground">{formatMoneda(sugerido)}</span>
                  </p>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min={0}
                      placeholder={sugerido > 0 ? String(sugerido) : "0"}
                      disabled={disabled}
                      data-testid={testId}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
