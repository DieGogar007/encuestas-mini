'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/api';
import { getToken, getUser } from '@/services/auth';
import { formatUserRole, ManagedUser, UserRole } from '@/utils/types';

type DraftUser = {
  name: string;
  email: string;
  role: UserRole;
  temporaryPassword: string;
};

type EditableUser = {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [draft, setDraft] = useState<DraftUser>({
    name: '',
    email: '',
    role: 'STUDENT',
    temporaryPassword: '',
  });
  const [editingUserId, setEditingUserId] = useState('');
  const [editingDraft, setEditingDraft] = useState<EditableUser | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    if (user.mustChangePassword) {
      router.replace('/change-password');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }

    loadUsers(token);
  }, [router]);

  async function loadUsers(token: string) {
    setError('');
    const data = await apiFetch<ManagedUser[]>('/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(data);
  }

  function startEditing(user: ManagedUser) {
    setEditingUserId(user.id);
    setEditingDraft({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return router.push('/login');

    try {
      setNotice('');
      setError('');
      const result = await apiFetch<{ user: ManagedUser; temporaryPassword: string }>('/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });

      setDraft({ name: '', email: '', role: 'STUDENT', temporaryPassword: '' });
      setNotice(`Usuario creado. Contraseña temporal: ${result.temporaryPassword}`);
      await loadUsers(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario');
    }
  }

  async function saveUser(userId: string) {
    const token = getToken();
    if (!token || !editingDraft) return router.push('/login');

    try {
      setBusyId(userId);
      setNotice('');
      setError('');
      await apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingDraft),
      });
      setEditingUserId('');
      setEditingDraft(null);
      await loadUsers(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario');
    } finally {
      setBusyId('');
    }
  }

  async function resetPassword(userId: string) {
    const token = getToken();
    if (!token) return router.push('/login');

    try {
      setBusyId(userId);
      setNotice('');
      setError('');
      const result = await apiFetch<{ message: string; temporaryPassword: string }>(`/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      setResetPasswordResult(result.temporaryPassword);
      await loadUsers(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo resetear la contraseña');
    } finally {
      setBusyId('');
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {resetPasswordResult !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Contraseña temporal generada</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">La nueva contraseña temporal del usuario es:</p>
            <div className="mt-4 select-all break-all rounded-xl bg-slate-100 px-4 py-3 font-mono text-lg font-bold text-[var(--foreground)]">
              {resetPasswordResult}
            </div>
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Una vez que cierres esta ventana, no podrás volvera verla.
            </p>
            <button
              type="button"
              onClick={() => setResetPasswordResult(null)}
              className="button-primary mt-5 w-full rounded-xl px-4 py-3 font-medium text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="glass-card soft-enter rounded-3xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Administración</p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Gestionar usuarios</h1>
            </div>
            <button type="button" onClick={() => router.push('/dashboard')} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]">
              Volver
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <section className="glass-card rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Crear usuario</h2>
            <form onSubmit={createUser} className="mt-5 space-y-4">
              <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" placeholder="Nombre completo" value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" placeholder="Correo institucional" value={draft.email} onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))} />
              <select className="w-full rounded-xl border border-[var(--border)] px-4 py-3" value={draft.role} onChange={(e) => setDraft((prev) => ({ ...prev, role: e.target.value as UserRole }))}>
                <option value="STUDENT">{formatUserRole('STUDENT')}</option>
                <option value="TEACHER">{formatUserRole('TEACHER')}</option>
                <option value="ADMIN">{formatUserRole('ADMIN')}</option>
              </select>
              <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" placeholder="Contraseña temporal opcional" value={draft.temporaryPassword} onChange={(e) => setDraft((prev) => ({ ...prev, temporaryPassword: e.target.value }))} />
              <button className="button-primary w-full rounded-xl px-4 py-3 font-medium text-white" type="submit">Crear usuario</button>
            </form>
          </section>

          <section className="glass-card rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Usuarios registrados</h2>
              <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm font-medium text-[var(--primary)]">{filteredUsers.length} usuarios</span>
            </div>

            <input
              className="mb-4 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              placeholder="Buscar por nombre o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {notice ? <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">{notice}</p> : null}
            {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            <div className="space-y-4">
              {filteredUsers.map((managedUser) => {
                const editing = editingUserId === managedUser.id && editingDraft;

                return (
                  <article key={managedUser.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                    {editing ? (
                      <div className="space-y-3">
                        <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" value={editingDraft.name} onChange={(e) => setEditingDraft({ ...editingDraft, name: e.target.value })} />
                        <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" value={editingDraft.email} onChange={(e) => setEditingDraft({ ...editingDraft, email: e.target.value })} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select className="rounded-xl border border-[var(--border)] px-4 py-3" value={editingDraft.role} onChange={(e) => setEditingDraft({ ...editingDraft, role: e.target.value as UserRole })}>
                            <option value="STUDENT">{formatUserRole('STUDENT')}</option>
                            <option value="TEACHER">{formatUserRole('TEACHER')}</option>
                            <option value="ADMIN">{formatUserRole('ADMIN')}</option>
                          </select>
                          <button type="button" onClick={() => setEditingDraft({ ...editingDraft, isActive: !editingDraft.isActive })} className={`rounded-xl px-4 py-3 text-sm font-medium ${editingDraft.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                            {editingDraft.isActive ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={() => saveUser(managedUser.id)} disabled={busyId === managedUser.id} className="button-primary rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                            {busyId === managedUser.id ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button type="button" onClick={() => { setEditingUserId(''); setEditingDraft(null); }} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">{managedUser.name}</h3>
                          <p className="text-sm text-[var(--muted)]">{managedUser.email}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 font-semibold text-[var(--primary)]">{formatUserRole(managedUser.role)}</span>
                            <span className={`rounded-full px-3 py-1 font-semibold ${managedUser.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                              {managedUser.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                            {managedUser.mustChangePassword && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">Cambio pendiente</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={() => startEditing(managedUser)} className="rounded-xl border border-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)]">
                            Editar
                          </button>
                          <button type="button" onClick={() => resetPassword(managedUser.id)} disabled={busyId === managedUser.id} className="rounded-xl border border-cyan-300 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50 disabled:opacity-60">
                            {busyId === managedUser.id ? 'Procesando...' : 'Resetear contraseña'}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
    </>
  );
}