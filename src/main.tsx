import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

export const mountRoot = (inId: string) =>
  createRoot(document.getElementById(inId)!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
