"use client";

import { CheckCircle2, LogIn, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button, Field, Panel, StatusBadge } from "@/components/ui";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type LoginMode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase ist lokal noch nicht konfiguriert. Bitte .env.local mit URL und anon key setzen.");
      return;
    }

    setLoading(true);

    const response =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    if (mode === "signin" || response.data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(
      "Account angelegt. Je nach Supabase-Einstellung musst du die E-Mail noch bestätigen. Danach kannst du dich einloggen."
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg2)] px-4 py-8 text-[var(--text)]">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,0.55fr)]">
        <section>
          <a href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--sidebar)] font-black text-white">
            tg
          </a>
          <p className="mt-8 text-xs font-bold uppercase text-[var(--text2)]">Supabase Auth</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">tiramigear anmelden</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text2)]">
            Der Login ist fuer Supabase vorbereitet. Sobald Projekt-URL und anon key gesetzt sind, koennen Benutzer angelegt,
            angemeldet und spaeter den Rollen Admin, User, Logistik oder Technik zugeordnet werden.
          </p>
        </section>

        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold">{mode === "signin" ? "Einloggen" : "Account anlegen"}</h2>
              <p className="mt-1 text-sm text-[var(--text2)]">Start fuer den ersten Admin und spaetere Benutzer.</p>
            </div>
            <StatusBadge tone={configured ? "good" : "warn"}>{configured ? "verbunden" : "env fehlt"}</StatusBadge>
          </div>

          <form className="grid gap-3" onSubmit={handleSubmit}>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">E-Mail</span>
              <Field
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@tirami.ch"
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[var(--text2)]">Passwort</span>
              <Field
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                type="password"
                value={password}
              />
            </label>

            <Button className="mt-2 inline-flex items-center justify-center gap-2" disabled={loading} type="submit" variant="primary">
              {mode === "signin" ? <LogIn className="h-4 w-4" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
              {loading ? "Bitte warten" : mode === "signin" ? "Einloggen" : "Account anlegen"}
            </Button>
          </form>

          <button
            className="mt-4 text-sm font-bold text-[var(--text)] underline-offset-4 hover:underline"
            onClick={() => {
              setMessage("");
              setMode((value) => (value === "signin" ? "signup" : "signin"));
            }}
            type="button"
          >
            {mode === "signin" ? "Ersten Account anlegen" : "Zurueck zum Login"}
          </button>

          {message ? (
            <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--bg2)] p-3 text-sm text-[var(--text2)]">
              {message}
            </div>
          ) : null}
        </Panel>

        <Panel className="lg:col-span-2">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" aria-hidden />
            <div>
              <h2 className="font-heading text-lg font-bold">Bootstrap-Regel</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text2)]">
                Der erste Benutzer braucht nach der Registrierung ein Profil mit Organisation und Admin-Rolle. Das machen wir
                einmalig ueber Supabase SQL oder ein Service-Role-Script, danach greifen die RLS-Regeln.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
