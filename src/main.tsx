import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { iniciarTema } from "./lib/tema";

iniciarTema();

createRoot(document.getElementById("root")!).render(<App />);
