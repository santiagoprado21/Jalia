# Deploy en Vercel

## Root Directory actual en Vercel

Tu proyecto `jalia-api-server` tiene **Root Directory = `artifacts/api-server`**.

Ya hay un `vercel.json` en esa carpeta que construye la calculadora y copia el output a `public/`.

Si prefieres simplificar, cambia en **Settings → General**:

| Campo | Valor |
|-------|--------|
| Root Directory | **vacío** |
| Output Directory | **`public`** |

## NO uses

- Root Directory = `artifacts/api-server` (backend que no se usa)
- Output Directory = `dist/public` (el build copia a `public` automáticamente)

## Si sigues con errores

Borra el proyecto `jalia-api-server` y créalo de nuevo con la **Opción A**.
