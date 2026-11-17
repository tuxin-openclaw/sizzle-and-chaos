import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { game } from "./game/engine";

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.DEV) {
  (window as unknown as { __sizzle: unknown }).__sizzle = { game };
}
