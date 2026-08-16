import { useRef, useState } from "react";
import { Download, Upload, CheckCircle2, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useJaliaData } from "@/contexts/jalia-data-context";
import { STORAGE_KEYS, type JaliaDatos } from "@/lib/jalia-store";

const LLAVES = [
  { key: STORAGE_KEYS.recetas, label: "Recetas", emoji: "🍰", field: "recetas" as const },
  { key: STORAGE_KEYS.ingredientes, label: "Ingredientes", emoji: "🧈", field: "ingredientes" as const },
  { key: STORAGE_KEYS.cotizaciones, label: "Cotizaciones", emoji: "📋", field: "cotizaciones" as const },
  { key: STORAGE_KEYS.ventas, label: "Ventas (caja)", emoji: "💰", field: "ventas" as const },
  { key: STORAGE_KEYS.listaCompras, label: "Lista de compras", emoji: "🛒", field: "listaCompras" as const },
  { key: STORAGE_KEYS.consignaciones, label: "Cartera", emoji: "👜", field: "consignaciones" as const },
];

function contarRegistros(datos: JaliaDatos) {
  return LLAVES.map(({ field, label, emoji }) => ({
    field,
    label,
    emoji,
    total: datos[field].length,
  }));
}

function jsonToDatos(json: Record<string, unknown>): JaliaDatos | null {
  const datos = json.datos;
  if (!datos || typeof datos !== "object") return null;

  const source = datos as Record<string, unknown>;
  const read = (legacyKey: string, modernField: keyof JaliaDatos) => {
    const raw = source[legacyKey] ?? source[modernField];
    return Array.isArray(raw) ? raw : [];
  };

  return {
    ingredientes: read(STORAGE_KEYS.ingredientes, "ingredientes"),
    recetas: read(STORAGE_KEYS.recetas, "recetas"),
    cotizaciones: read(STORAGE_KEYS.cotizaciones, "cotizaciones"),
    ventas: read(STORAGE_KEYS.ventas, "ventas"),
    listaCompras: read(STORAGE_KEYS.listaCompras, "listaCompras"),
    consignaciones: read(STORAGE_KEYS.consignaciones, "consignaciones"),
  };
}

export default function Respaldo() {
  const { datos, replaceAll, clearAll, cloudEnabled } = useJaliaData();
  const [importStatus, setImportStatus] = useState<"idle" | "ok" | "error">("idle");
  const [importMsg, setImportMsg] = useState("");
  const [pendingData, setPendingData] = useState<JaliaDatos | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [borrarOpen, setBorrarOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resumenActual = contarRegistros(datos);
  const totalActual = resumenActual.reduce((s, r) => s + r.total, 0);

  function exportar() {
    const payload = {
      version: 2,
      exportadoEl: new Date().toISOString(),
      negocio: "JALIA",
      datos: {
        [STORAGE_KEYS.ingredientes]: datos.ingredientes,
        [STORAGE_KEYS.recetas]: datos.recetas,
        [STORAGE_KEYS.cotizaciones]: datos.cotizaciones,
        [STORAGE_KEYS.ventas]: datos.ventas,
        [STORAGE_KEYS.listaCompras]: datos.listaCompras,
        [STORAGE_KEYS.consignaciones]: datos.consignaciones,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JALIA_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileRef.current) return;
    fileRef.current.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const parsed = jsonToDatos(json);
        if (!parsed) throw new Error("Formato inválido");
        setPendingData(parsed);
        setConfirmOpen(true);
        setImportStatus("idle");
      } catch {
        setImportStatus("error");
        setImportMsg("El archivo no es válido o está dañado. Asegúrate de subir un archivo de respaldo de JALIA.");
      }
    };
    reader.readAsText(file);
  }

  function confirmarImport() {
    if (!pendingData) return;
    replaceAll(pendingData);
    setPendingData(null);
    setConfirmOpen(false);
    setImportStatus("ok");
    setImportMsg(
      cloudEnabled
        ? "¡Datos restaurados y sincronizados en la nube!"
        : "¡Datos restaurados correctamente! Recarga la página para verlos.",
    );
  }

  function borrarTodo() {
    clearAll();
    setBorrarOpen(false);
    setImportStatus("ok");
    setImportMsg("Todos los datos han sido eliminados.");
    window.location.reload();
  }

  const pendingResumen = pendingData ? contarRegistros(pendingData) : [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl font-bold text-foreground">Respaldo de datos</h2>
        <p className="text-muted-foreground mt-1">
          {cloudEnabled
            ? "Tus datos se sincronizan en la nube. También puedes exportar un archivo JSON de respaldo."
            : "Exporta todos tus datos para guardarlos o transferirlos a otro dispositivo"}
        </p>
      </div>

      <AnimatePresence>
        {importStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-start gap-3 rounded-xl p-4 mb-6 border ${
              importStatus === "ok"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {importStatus === "ok" ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">{importMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Datos guardados actualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumenActual.map(({ field, label, emoji, total }) => (
              <div key={field} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{emoji}</span>
                  <span className="text-sm text-foreground">{label}</span>
                </div>
                <span className={`text-sm font-semibold ${total > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {total} {total === 1 ? "registro" : "registros"}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-foreground">{totalActual} registros</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Exportar respaldo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Descarga un archivo <code className="bg-muted px-1 rounded text-xs">.json</code> con todas tus
                recetas, ingredientes, cotizaciones y ventas.
              </p>
              <Button onClick={exportar} className="w-full gap-2" data-testid="button-exportar-respaldo">
                <Download className="w-4 h-4" />
                Descargar respaldo
              </Button>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-600" />
                Importar respaldo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sube un archivo de respaldo de JALIA para restaurar tus datos.
                <span className="font-semibold text-orange-700"> Los datos actuales serán reemplazados.</span>
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={onFileChange}
                data-testid="input-importar-respaldo"
              />
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="w-full gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                data-testid="button-importar-respaldo"
              >
                <Upload className="w-4 h-4" />
                Seleccionar archivo
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base flex items-center gap-2 text-destructive">
                <Trash2 className="w-4 h-4" />
                Borrar todos los datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente todas las recetas, ingredientes, cotizaciones y ventas guardadas.
              </p>
              <Button
                variant="outline"
                onClick={() => setBorrarOpen(true)}
                className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                data-testid="button-borrar-todo"
              >
                <Trash2 className="w-4 h-4" />
                Borrar todo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar este respaldo?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Esto reemplazará tus datos actuales con el contenido del archivo. El archivo contiene:</p>
                <div className="bg-muted rounded-lg p-3 space-y-1">
                  {pendingResumen.map(({ field, emoji, label, total }) => (
                    <div key={field} className="flex justify-between text-sm">
                      <span>
                        {emoji} {label}
                      </span>
                      <span className="font-semibold">{total} registros</span>
                    </div>
                  ))}
                </div>
                <p className="text-orange-700 font-medium text-sm">
                  Tus datos actuales ({totalActual} registros) serán reemplazados.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-import">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarImport} data-testid="button-confirmar-import">
              Sí, restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={borrarOpen} onOpenChange={setBorrarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar todos los datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán {totalActual} registros permanentemente. Te recomendamos exportar un respaldo antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-borrar">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={borrarTodo}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirmar-borrar"
            >
              Sí, borrar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
