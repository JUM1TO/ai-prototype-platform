import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AgentRunResult, SolutionInfo } from "@platform/contracts";
import "./styles.css";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function App() {
  const [solution, setSolution] = useState<SolutionInfo | null>(null);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch(`${apiUrl}/api/solution`)
      .then((response) => response.json())
      .then((loaded: SolutionInfo) => {
        document.documentElement.style.setProperty("--primary", loaded.branding.primaryColor);
        document.title = loaded.branding.title;
        setSolution(loaded);
      });
  }, []);

  async function runDemo() {
    setLoading(true);
    const response = await fetch(`${apiUrl}/api/agents/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agent: "document-reviewer",
        input: { document: "Contrato sintético de demostración" },
        context: { userId: "demo-user", sessionId: crypto.randomUUID() }
      })
    });
    setResult(await response.json());
    setLoading(false);
  }

  return (
    <main>
      <header>
        <span className="eyebrow">{solution?.branding.title ?? "AI Prototype Platform"}</span>
        <h1>{solution?.name ?? "Cargando solución…"}</h1>
        <p>Portal modular para demostrar capacidades de IA con datos sintéticos.</p>
      </header>
      <section className="card">
        <div>
          <span className="status">Entorno de demostración</span>
          <h2>Agente de revisión</h2>
          <p>Ejecuta el proveedor simulado incluido en la estructura inicial.</p>
        </div>
        <button onClick={runDemo} disabled={loading}>
          {loading ? "Procesando…" : "Ejecutar demo"}
        </button>
        {result && <pre>{result.output}</pre>}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
