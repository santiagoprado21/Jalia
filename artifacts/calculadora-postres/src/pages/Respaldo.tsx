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

const LLAVES = [
  { key: "postres_recetas",      label: "Recetas",       emoji: "🍰" },
  { key: "postres_ingredientes", label: "Ingredientes",  emoji: "🧈" },
  { key: "postres_cotizaciones", label: "Cotizaciones",  emoji: "📋" },
  { key: "postres_ventas",       label: "Ventas (caja)", emoji: "💰" },
  { key: "postres_lista_compras", label: "Lista de compras", emoji: "🛒" },
  { key: "postres_consignaciones", label: "Cartera", emoji: "👜" },
];

function leerDatos() {
  const datos: Record<string, unknown> = {};
  LLAVES.forEach(({ key }) => {
    try {
      const raw = localStorage.getItem(key);
      datos[key] = raw ? JSON.parse(raw) : [];
    } catch {
      datos[key] = [];
    }
  });
  return datos;
}

function contarRegistros(datos: Record<string, unknown>) {
  return LLAVES.map(({ key, label, emoji }) => {
    const arr = Array.isArray(datos[key]) ? (datos[key] as unknown[]) : [];
    return { key, label, emoji, total: arr.length };
  });
}

export default function Respaldo() {
  const [importStatus, setImportStatus] = useState<"idle" | "ok" | "error">("idle");
  const [importMsg, setImportMsg]       = useState("");
  const [pendingData, setPendingData]   = useState<Record<string, unknown> | null>(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [borrarOpen, setBorrarOpen]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const datosActuales = leerDatos();
  const resumenActual = contarRegistros(datosActuales);
  const totalActual   = resumenActual.reduce((s, r) => s + r.total, 0);

  // ── Export ──────────────────────────────────────────────────────────────
  function exportar() {
    const datos = leerDatos();
    const payload = {
      version: 1,
      exportadoEl: new Date().toISOString(),
      negocio: "JALIA",
      datos,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `JALIA_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import ───────────────────────────────────────────────────────────────
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileRef.current) return;
    fileRef.current.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.datos || typeof json.datos !== "object") {
          throw new Error("Formato inválido");
        }
        // Validate each key is an array
        LLAVES.forEach(({ key }) => {
          if (json.datos[key] !== undefined && !Array.isArray(json.datos[key])) {
            throw new Error(`Datos de ${key} no son válidos`);
          }
        });
        setPendingData(json.datos);
        setConfirmOpen(true);
        setImportStatus("idle");
      } catch (err) {
        setImportStatus("error");
        setImportMsg("El archivo no es válido o está dañado. Asegúrate de subir un archivo de respaldo de JALIA.");
      }
    };
    reader.readAsText(file);
  }

  function confirmarImport() {
    if (!pendingData) return;
    LLAVES.forEach(({ key }) => {
      const val = pendingData[key];
      if (Array.isArray(val)) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    });
    setPendingData(null);
    setConfirmOpen(false);
    setImportStatus("ok");
    setImportMsg("¡Datos restaurados correctamente! Recarga la página para verlos.");
  }

  function borrarTodo() {
    LLAVES.forEach(({ key }) => localStorage.removeItem(key));
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
          Exporta todos tus datos para guardarlos o transferirlos a otro dispositivo
        </p>
      </div>

      {/* Status banner */}
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
            {importStatus === "ok"
              ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              : <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            }
            <p className="text-sm font-medium">{importMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Current data summary */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Datos guardados actualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumenActual.map(({ key, label, emoji, total }) => (
              <div key={key} className="flex items-center justify-between py-1">
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

        {/* Actions */}
        <div className="space-y-4">

          {/* Export */}
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
                recetas, ingredientes, cotizaciones y ventas. Guárdalo en Google Drive, WhatsApp o donde prefieras.
                Incluye también lista de compras y cartera.
              </p>
              <Button onClick={exportar} className="w-full gap-2" data-testid="button-exportar-respaldo">
                <Download className="w-4 h-4" />
                Descargar respaldo
              </Button>
            </CardContent>
          </Card>

          {/* Import */}
          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-600" />
                Importar respaldo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sube un archivo de respaldo de JALIA para restaurar tus datos en este dispositivo.
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

          {/* Danger zone */}
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
                <span className="font-semibold text-destructive"> Esta acción no se puede deshacer.</span>
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

      {/* Confirm import dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar este respaldo?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Esto reemplazará tus datos actuales con el contenido del archivo. El archivo contiene:</p>
                <div className="bg-muted rounded-lg p-3 space-y-1">
                  {pendingResumen.map(({ key, emoji, label, total }) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{emoji} {label}</span>
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
            <AlertDialogAction
              onClick={confirmarImport}
              data-testid="button-confirmar-import"
            >
              Sí, restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete all */}
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
