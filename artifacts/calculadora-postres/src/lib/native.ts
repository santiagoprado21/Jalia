import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

export const isNativeApp = Capacitor.isNativePlatform();

export async function initNativeShell() {
  if (!isNativeApp) return;

  document.documentElement.classList.add("native-app");

  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#FFF8F0" });
    await SplashScreen.hide();
  } catch {
    // Plugins optional during web preview
  }
}
