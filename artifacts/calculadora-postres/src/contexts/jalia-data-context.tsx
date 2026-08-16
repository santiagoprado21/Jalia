import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/auth-context";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  datosToRow,
  EMPTY_DATOS,
  isCloudEmpty,
  readLocalDatos,
  rowToDatos,
  writeLocalDatos,
  type JaliaDatos,
} from "@/lib/jalia-store";

interface JaliaDataContextValue {
  ready: boolean;
  syncing: boolean;
  cloudEnabled: boolean;
  datos: JaliaDatos;
  setDatos: (updater: JaliaDatos | ((prev: JaliaDatos) => JaliaDatos)) => void;
  replaceAll: (datos: JaliaDatos) => void;
  clearAll: () => void;
}

const JaliaDataContext = createContext<JaliaDataContextValue | null>(null);

export function JaliaDataProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const [datos, setDatosState] = useState<JaliaDatos>(() => readLocalDatos());
  const [ready, setReady] = useState(!configured);
  const [syncing, setSyncing] = useState(false);
  const datosRef = useRef(datos);
  const saveTimerRef = useRef<number | null>(null);
  const applyingRemoteRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  datosRef.current = datos;

  const persistLocal = useCallback((next: JaliaDatos) => {
    writeLocalDatos(next);
  }, []);

  const pushToCloud = useCallback(
    async (next: JaliaDatos) => {
      if (!configured || !user) return;
      setSyncing(true);
      try {
        const supabase = getSupabase();
        const { error } = await supabase.from("jalia_datos").upsert(datosToRow(user.id, next));
        if (error) console.error("Error guardando en Supabase:", error.message);
      } finally {
        setSyncing(false);
      }
    },
    [configured, user],
  );

  const scheduleCloudSave = useCallback(
    (next: JaliaDatos) => {
      if (!configured || !user || applyingRemoteRef.current) return;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        void pushToCloud(next);
      }, 800);
    },
    [configured, pushToCloud, user],
  );

  const setDatos = useCallback(
    (updater: JaliaDatos | ((prev: JaliaDatos) => JaliaDatos)) => {
      setDatosState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persistLocal(next);
        scheduleCloudSave(next);
        return next;
      });
    },
    [persistLocal, scheduleCloudSave],
  );

  const replaceAll = useCallback(
    (next: JaliaDatos) => {
      setDatosState(next);
      persistLocal(next);
      void pushToCloud(next);
    },
    [persistLocal, pushToCloud],
  );

  const clearAll = useCallback(() => {
    replaceAll(EMPTY_DATOS);
  }, [replaceAll]);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }

    if (!user) {
      setDatosState(readLocalDatos());
      setReady(true);
      return;
    }

    const userId = user.id;
    let cancelled = false;

    async function loadCloud() {
      setReady(false);
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("jalia_datos")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("Error cargando Supabase:", error.message);
          setDatosState(readLocalDatos());
          setReady(true);
          return;
        }

        const local = readLocalDatos();
        const localHasData = !isCloudEmpty(local);

        if (!data) {
          const initial = localHasData ? local : EMPTY_DATOS;
          setDatosState(initial);
          persistLocal(initial);
          await supabase.from("jalia_datos").upsert(datosToRow(userId, initial));
          setReady(true);
          return;
        }

        const cloud = rowToDatos(data);
        if (isCloudEmpty(cloud) && localHasData) {
          setDatosState(local);
          persistLocal(local);
          await supabase.from("jalia_datos").upsert(datosToRow(userId, local));
        } else {
          setDatosState(cloud);
          persistLocal(cloud);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadCloud();

    return () => {
      cancelled = true;
    };
  }, [configured, persistLocal, user]);

  useEffect(() => {
    if (!configured || !user || !ready) return;

    const supabase = getSupabase();
    const channel = supabase
      .channel(`jalia-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jalia_datos",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          applyingRemoteRef.current = true;
          const next = rowToDatos(payload.new as Record<string, unknown>);
          setDatosState(next);
          persistLocal(next);
          window.setTimeout(() => {
            applyingRemoteRef.current = false;
          }, 0);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [configured, persistLocal, ready, user]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const value = useMemo<JaliaDataContextValue>(
    () => ({
      ready,
      syncing,
      cloudEnabled: configured && Boolean(user),
      datos,
      setDatos,
      replaceAll,
      clearAll,
    }),
    [ready, syncing, configured, user, datos, setDatos, replaceAll, clearAll],
  );

  return <JaliaDataContext.Provider value={value}>{children}</JaliaDataContext.Provider>;
}

export function useJaliaData() {
  const ctx = useContext(JaliaDataContext);
  if (!ctx) throw new Error("useJaliaData debe usarse dentro de JaliaDataProvider");
  return ctx;
}

export function useJaliaDatos() {
  return useJaliaData().datos;
}

export function useJaliaSetDatos() {
  return useJaliaData().setDatos;
}
