import { useState } from "react";
import { Plus, Pencil, Trash2, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEmpaques, useRecetas } from "@/hooks/use-data";
import { formatMoneda } from "@/lib/moneda";
import type { Empaque } from "@/types";
import EmpaqueDialog from "@/components/EmpaqueDialog";
import { Button } from "@/components/ui/button";
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

export default function Empaques() {
  const { empaques, eliminarEmpaque } = useEmpaques();
  const { recetas } = useRecetas();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empaque | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const usosDe = (id: string) => recetas.filter((r) => r.empaques?.some((e) => e.empaqueId === id)).length;
  const usosEliminar = deleteId ? usosDe(deleteId) : 0;

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(emp: Empaque) {
    setEditing(emp);
    setDialogOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Empaques</h2>
          <p className="text-muted-foreground mt-1">
            {empaques.length === 0
              ? "Crea tus empaques una vez y elígelos en cada receta."
              : `${empaques.length} empaque${empaques.length !== 1 ? "s" : ""} registrado${empaques.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={openNew} data-testid="button-nuevo-empaque" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nuevo empaque
        </Button>
      </div>

      {empaques.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Sin empaques todavía</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Registra cajas, bolsas o vasitos con su costo. Si cambias un precio aquí, se actualiza en todas las recetas que lo usan.
          </p>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar primer empaque
          </Button>
        </motion.div>
      )}

      {empaques.length > 0 && (
        <div className="lista-scroll max-h-[65vh] pr-2">
          <div className="space-y-2">
            <AnimatePresence>
              {empaques.map((emp, i) => {
                const usos = usosDe(emp.id);
                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.04 }}
                    data-testid={`row-empaque-${emp.id}`}
                    className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Gift className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{emp.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {usos === 0 ? "Sin usar" : `En ${usos} receta${usos !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Costo c/u</p>
                        <p className="font-semibold text-primary text-sm">{formatMoneda(emp.costo)}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(emp.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      <EmpaqueDialog open={dialogOpen} onOpenChange={setDialogOpen} empaque={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar empaque</AlertDialogTitle>
            <AlertDialogDescription>
              {usosEliminar > 0
                ? `Se quitará de ${usosEliminar} receta${usosEliminar !== 1 ? "s" : ""} y su costo dejará de sumarse.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) eliminarEmpaque(deleteId);
                setDeleteId(null);
              }}
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
