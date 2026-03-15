'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { LoginResponse } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      saveSession(data);
      router.push(data.user.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="soft-enter grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--border)] bg-white/95 shadow-2xl lg:grid-cols-2">
        <section className="hidden items-center justify-center bg-[linear-gradient(145deg,#0038a8,#0a2b7a)] p-10 text-white lg:flex">
          <div className="mx-auto max-w-sm text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-200">Plataforma UTB</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight">Sistema de encuestas</h1>
          </div>
        </section>

        <section className="flex items-center justify-center p-8 sm:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">Acceso</p>
            <h2 className="mt-3 text-center text-3xl font-semibold text-[var(--foreground)]">Iniciar sesión</h2>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Correo</label>
                <input
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100"
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Contraseña</label>
                <input
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100"
                  type="password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                />
              </div>

              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

              <button
                className="button-primary w-full rounded-xl px-4 py-3 font-medium text-white transition disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
