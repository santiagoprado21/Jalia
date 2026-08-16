# Deploy en Vercel

## Si Vercel no detecta commits nuevos

1. Entra a [vercel.com/dashboard](https://vercel.com/dashboard) → tu proyecto **Jalia**
2. **Settings → Git**
3. Verifica que diga: **Connected to `santiagoprado21/Jalia`**
4. **Production Branch** debe ser **`main`** (no `master`)
5. Si no está conectado, o está mal:
   - **Connect Git Repository** → elige `santiagoprado21/Jalia`
   - O **Disconnect** y vuelve a conectar

### Permisos de GitHub

1. GitHub → **Settings → Applications → Vercel**
2. **Configure** → asegúrate de que el repo **Jalia** tenga acceso

## Si hay deploys pero sigue la versión vieja

Revisa **Deployments** en Vercel. Si los últimos dicen **Error**:

- Abre el log del build
- Suele ser `pnpm install` fallando por lockfile desactualizado  
  (ya corregido con `--no-frozen-lockfile` en `vercel.json`)

Luego: **Deployments → ⋮ en el último commit → Redeploy**

## Forzar deploy manual

En Vercel → **Deployments → Create Deployment**:

- Branch: `main`
- Confirma

O desde tu máquina (con Vercel CLI logueado):

```bash
cd /Users/santiago.prado/Downloads/Dessert-Pricing-Calc
pnpm install
git pull
npx vercel --prod
```

## Config correcta del proyecto

**Importante:** al crear el proyecto en Vercel, NO elijas `artifacts/api-server`. Ese folder es un backend Express que no se usa en producción (la app guarda todo en localStorage).

| Campo | Valor |
|-------|--------|
| Repo | `santiagoprado21/Jalia` |
| Root Directory | `.` (raíz del repo, **dejar vacío**) |
| Framework | Other |
| Build Command | `pnpm --filter @workspace/calculadora-postres build` |
| Output | `public` (se genera automáticamente en el build) |
| Install | `pnpm install --no-frozen-lockfile` |

Estos valores ya están en `vercel.json` en la raíz.

Si ya creaste un proyecto con Root Directory = `artifacts/api-server`, bórralo y crea uno nuevo con la raíz del repo, o cambia **Settings → General → Root Directory** a `.` (vacío).
