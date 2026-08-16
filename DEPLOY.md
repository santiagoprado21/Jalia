# Deploy en Vercel

## Opción A — Root Directory vacío (recomendado)

| Campo | Valor |
|-------|--------|
| Repo | `santiagoprado21/Jalia` |
| Root Directory | **vacío** |
| Output Directory | **`public`** |
| Framework | **Other** |

Usa el `vercel.json` de la raíz del repo.

## Opción B — Root Directory = `artifacts/calculadora-postres`

| Campo | Valor |
|-------|--------|
| Root Directory | **`artifacts/calculadora-postres`** |
| Output Directory | **`public`** |
| Framework | **Other** |

Usa el `vercel.json` dentro de esa carpeta.

## NO uses

- Root Directory = `artifacts/api-server` (backend que no se usa)
- Output Directory = `dist/public` (el build copia a `public` automáticamente)

## Si sigues con errores

Borra el proyecto `jalia-api-server` y créalo de nuevo con la **Opción A**.
