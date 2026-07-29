import { createRoot } from "react-dom/client";
import { Component, type ErrorInfo, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SILO] Erreur de démarrage", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-[#0A1428] text-white flex items-center justify-center p-6">
        <section className="max-w-lg rounded-2xl border border-white/10 bg-[#182848] p-8 text-center shadow-2xl">
          <h1 className="font-serif text-3xl font-semibold">SILO</h1>
          <p className="mt-4 text-slate-200">
            La plateforme n’a pas pu démarrer correctement.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Rechargez la page. Si le problème persiste, notre équipe pourra
            l’identifier grâce au diagnostic enregistré.
          </p>
          <button
            className="mt-6 rounded-full bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500"
            onClick={() => window.location.reload()}
          >
            Recharger la page
          </button>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
