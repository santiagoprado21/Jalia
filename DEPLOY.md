# Deploy en Vercel

## Configuración obligatoria (lee esto primero)

En **Settings → General** del proyecto Vercel:

| Campo | Valor correcto |
|-------|----------------|
| Root Directory | **vacío** (raíz del repo, NO `artifacts/api-server`) |
| Output Directory | **`public`** |
| Framework | **Other** |

Si Root Directory no está vacío, el deploy **fallará**.

## Importar el proyecto

1. [vercel.com/new](https://vercel.com/new) → Import **`santiagoprado21/Jalia`**
2. Branch: **`main`**
3. Root Directory: **dejar vacío**
4. Deploy

El `vercel.json` en la raíz ya configura install, build y output.

## Cómo funciona el build

En Vercel, Vite escribe directamente en la carpeta `public/` en la raíz del repo (sin copiar archivos). Localmente sigue usando `artifacts/calculadora-postres/dist/public`.

## Si sigue fallando

1. **Borra** el proyecto `jalia-api-server` (tiene mala config)
2. Crea uno nuevo con los valores de arriba
3. O en el proyecto existente: **Settings → General → Root Directory** → borrar el valor → Save → Redeploy

## Repo conectado

Debe decir **`santiagoprado21/Jalia`**, no `jalia_postres`.

## Deploy manual (opcional)

```bash
cd /Users/santiago.prado/Downloads/Dessert-Pricing-Calc
pnpm install
npx vercel --prod
```
