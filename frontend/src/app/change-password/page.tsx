'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/api';
import { getToken, getUser, saveSession } from '@/services/auth';
import { LoginResponse } from '@/utils/types';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.replace('/login');
      return;
    }

    if (!user.mustChangePassword) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return router.push('/login');

    if (newPassword !== confirmPassword) {
      setError('La confirmación de contraseña no coincide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch<LoginResponse>('/auth/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      saveSession(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-card soft-enter w-full max-w-lg rounded-3xl border border-[var(--border)] p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-700">Seguridad</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Cambia tu contraseña</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Este usuario tiene contraseña temporal. Debes cambiarla para continuar.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Contraseña actual</label>
            <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Nueva contraseña</label>
            <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Confirmar nueva contraseña</label>
            <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button className="button-primary w-full rounded-xl px-4 py-3 font-medium text-white" type="submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </main>
  );
}