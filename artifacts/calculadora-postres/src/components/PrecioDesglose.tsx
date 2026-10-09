import type { CalcReceta } from "@/types";
import { formatMoneda } from "@/lib/moneda";
import { Separator } from "@/components/ui/separator";

interface Props {
  calc: CalcReceta;
  margenGanancia: number;
  margenMayorista?: number;
  precioFinalDetal?: number;
  precioFinalMayorista?: number;
  testIdPrefix?: string;
}

export default function PrecioDesglose({
  calc,
  margenGanancia,
  margenMayorista,
  precioFinalDetal,
  precioFinalMayorista,
  testIdPrefix = "calc",
}: Props) {
  const preciosFinales = [
    { label: "Detal", precio: precioFinalDetal },
    { label: "Mayorista", precio: precioFinalMayorista },
  ].filter((p): p is { label: string; precio: number } => (p.precio ?? 0) > 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Costo ingredientes</span>
        <span className="font-medium" data-testid={`${testIdPrefix}-costo-ingredientes`}>
          {formatMoneda(calc.costoIngredientes)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Gastos fijos</span>
        <span className="font-medium" data-testid={`${testIdPrefix}-costos-fijos`}>
          {formatMoneda(calc.costosFijos)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Gastos variables</span>
        <span className="font-medium" data-testid={`${testIdPrefix}-costos-variables`}>
          {formatMoneda(calc.costosVariables)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Empaques</span>
        <span className="font-medium" data-testid={`${testIdPrefix}-costo-empaque`}>
          {formatMoneda(calc.costoEmpaque)}
        </span>
      </div>
      <Separator />
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Costo total</span>
        <span className="font-medium" data-testid={`${testIdPrefix}-costo-total`}>
          {formatMoneda(calc.costoTotal)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Costo por porcion</span>
        <span className="font-medium" data-testid={`${testIdPrefix}-costo-porcion`}>
          {formatMoneda(calc.costoPorPorcion)}
        </span>
      </div>
      <Separator />
      <div className="flex justify-between">
        <span className="font-semibold text-foreground">Precio al detal</span>
        <span className="font-bold text-primary text-lg" data-testid={`${testIdPrefix}-precio-sugerido`}>
          {formatMoneda(calc.precioVentaSugerido)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Ganancia detal</span>
        <span className="font-medium text-green-700" data-testid={`${testIdPrefix}-ganancia-total`}>
          {formatMoneda(calc.gananciaTotal)}
        </span>
      </div>
      {calc.precioMayorista !== undefined && calc.precioMayorista > 0 && (
        <>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold text-foreground">Precio mayorista</span>
            <span className="font-bold text-blue-700 text-lg" data-testid={`${testIdPrefix}-precio-mayorista`}>
              {formatMoneda(calc.precioMayorista)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ganancia mayorista</span>
            <span className="font-medium text-blue-600">
              {formatMoneda(calc.gananciaMayorista ?? 0)}
            </span>
          </div>
        </>
      )}
      {preciosFinales.length > 0 && (
        <>
          <Separator />
          <p className="text-xs font-medium text-muted-foreground">Tu precio de venta</p>
          {preciosFinales.map(({ label, precio }) => {
            const ganancia = precio - calc.costoPorPorcion;
            return (
              <div key={label} className="flex justify-between text-sm" data-testid={`${testIdPrefix}-precio-final-${label.toLowerCase()}`}>
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">
                  {formatMoneda(precio)}{" "}
                  <span className={`text-xs font-normal ${ganancia >= 0 ? "text-green-700" : "text-destructive"}`}>
                    ({ganancia >= 0 ? "+" : ""}{formatMoneda(ganancia)} c/u)
                  </span>
                </span>
              </div>
            );
          })}
        </>
      )}
      <div className="bg-background rounded-lg p-3 mt-2">
        <p className="text-xs text-muted-foreground">
          Detal: <span className="font-semibold text-foreground">{margenGanancia}%</span>
          {(margenMayorista ?? 0) > 0 && (
            <> &nbsp;·&nbsp; Mayorista: <span className="font-semibold text-foreground">{margenMayorista}%</span></>
          )}
        </p>
      </div>
    </div>
  );
}
