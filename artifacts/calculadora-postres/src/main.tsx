import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { initNativeShell, isNativeApp } from "./lib/native";
import "./index.css";

initNativeShell();

if (!isNativeApp) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
