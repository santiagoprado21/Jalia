# Supabase — sincronización JALIA

La app usa **Supabase** para que celular y computador vean los mismos datos.

> **Nota:** Las instrucciones de Next.js (`@supabase/ssr`, middleware) **no aplican**. JALIA es Vite + React.

## 1. Crear tablas

En [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**, pega y ejecuta:

`supabase/schema.sql`

## 2. Crear usuario de la familia

1. **Authentication → Users → Add user**
2. Correo y contraseña que usarán en cel y compu (la misma cuenta en ambos)

## 3. Variables de entorno

### Local

Copia `.env.example` a `.env.local` en `artifacts/calculadora-postres/`:

```env
VITE_SUPABASE_URL=https://gnyvjvmnwsmkzzmszkdj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

También funciona `VITE_SUPABASE_ANON_KEY` (clave anon clásica de Supabase → Settings → API).

### Vercel

En **Settings → Environment Variables** del proyecto:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable key o anon key |

Luego **Redeploy** (Vite embebe estas variables en el build).

## 4. Cómo funciona

1. Abres la app → pantalla de **login**
2. Entras con el correo/contraseña de la familia
3. Si el celular tenía datos locales, se suben a la nube la primera vez
4. En otro dispositivo, entras con la **misma cuenta** → ves los mismos datos
5. Cambios en uno se sincronizan al otro (Realtime)

## 5. Sin internet

- Necesitas internet para **iniciar sesión** y **sincronizar**
- Los datos también se guardan en el navegador como respaldo local

## 6. Respaldo JSON

La pantalla **Respaldo** sigue funcionando para exportar/importar archivos `.json`.
