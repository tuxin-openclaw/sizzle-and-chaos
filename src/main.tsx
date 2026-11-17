import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { game } from "./game/engine";

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.DEV) {
  (window as unknown as { __sizzle: unknown }).__sizzle = { game };
}


if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {
        /* Fullscreen still works if service worker registration is blocked. */
      });
  });
}
