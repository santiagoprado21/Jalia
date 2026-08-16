# JALIA en celular

La app funciona de 3 formas en celular:

1. **PWA** — abrir la URL de Vercel → menú del navegador → *Agregar a pantalla de inicio*
2. **Android (APK)** — build nativo con Capacitor
3. **iPhone** — build nativo con Xcode (requiere Mac)

## Instalar como app (PWA) — lo más fácil

1. Abre la URL en Chrome (Android) o Safari (iPhone)
2. Android: menú ⋮ → *Instalar app* o *Agregar a pantalla de inicio*
3. iPhone: botón compartir → *Agregar a inicio*

Los datos quedan guardados en el celular.

## Build Android (APK)

Requisitos: Node, pnpm, [Android Studio](https://developer.android.com/studio)

```bash
# Desde la raíz del repo
pnpm install
pnpm --filter @workspace/calculadora-postres mobile:build
pnpm --filter @workspace/calculadora-postres cap:android
```

En Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

El APK queda en `android/app/build/outputs/apk/`.

## Build iPhone

Requisitos: Mac con Xcode

```bash
pnpm install
pnpm --filter @workspace/calculadora-postres mobile:build
pnpm --filter @workspace/calculadora-postres cap:ios
```

Abre el proyecto en Xcode y corre en un iPhone o sube a TestFlight.

## Comandos útiles

| Comando | Qué hace |
|---------|----------|
| `mobile:build` | Compila la web y sincroniza con Android/iOS |
| `cap:sync` | Copia el build a las carpetas nativas |
| `cap:android` | Abre Android Studio |
| `cap:ios` | Abre Xcode |
