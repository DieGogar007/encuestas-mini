'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { clearSession, getToken, getUser } from '@/lib/auth';
import { formatUserRole, Survey, User } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [error, setError] = useState('');
  const [busySurveyId, setBusySurveyId] = useState('');
  const [createdNoticeVisible, setCreatedNoticeVisible] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);

  const activeSurveys = surveys.filter((survey) => survey.isActive);
  const inactiveVisibleSurveys = surveys.filter((survey) => {
    if (survey.isActive) return false;
    if (!user) return false;
    return user.role === 'ADMIN' || survey.author?.id === user.id;
  });

  useEffect(() => {
    const currentUser = getUser();
    const token = getToken();

    if (!currentUser || !token) {
      router.replace('/login');
      return;
    }

    if (currentUser.mustChangePassword) {
      router.replace('/change-password');
      return;
    }

    setUser(currentUser);

    loadSurveys(token);
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('created') === '1') {
      setCreatedNoticeVisible(true);
      const timeoutId = setTimeout(() => setCreatedNoticeVisible(false), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  async function loadSurveys(token: string) {
    setError('');

    apiFetch<Survey[]>('/surveys', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setSurveys)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las encuestas'));
  }

  function logout() {
    clearSession();
    router.push('/login');
  }

  async function deleteSurvey(surveyId: string) {
    const token = getToken();
    if (!token) return router.push('/login');

    try {
      setBusySurveyId(surveyId);
      await apiFetch<{ message: string }>(`/surveys/${surveyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadSurveys(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la encuesta');
    } finally {
      setBusySurveyId('');
    }
  }

  async function toggleSurveyState(survey: Survey) {
    const token = getToken();
    if (!token) return router.push('/login');

    try {
      setBusySurveyId(survey.id);
      await apiFetch(`/surveys/${survey.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !survey.isActive }),
      });
      await loadSurveys(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la encuesta');
    } finally {
      setBusySurveyId('');
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="glass-card soft-enter rounded-3xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Panel principal</p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Bienvenido{user ? `, ${user.name}` : ''}</h1>
              <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">Rol actual: <span className="font-semibold text-[var(--primary)]">{user ? formatUserRole(user.role) : ''}</span></p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user?.role === 'ADMIN' && (
                <Link href="/users" className="rounded-xl border border-cyan-300 px-5 py-3 text-sm font-medium text-cyan-800 transition hover:bg-cyan-50">
                  Gestionar usuarios
                </Link>
              )}

              {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
                <Link href="/surveys/create" className="button-primary rounded-xl px-5 py-3 text-sm font-medium transition hover:shadow-md">
                  Nueva encuesta
                </Link>
              )}
              <button onClick={logout} className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--primary-soft)]">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        <section className="mt-8">
          {createdNoticeVisible && (
            <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Encuesta creada con éxito.
            </p>
          )}

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">Encuestas disponibles</h2>
            <span className="w-fit rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm font-medium text-[var(--primary)]">{activeSurveys.length} activas</span>
          </div>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activeSurveys.map((survey) => (
              <article key={survey.id} className="glass-card soft-enter rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">{survey.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">{survey.description}</p>
                  </div>
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold leading-none text-cyan-700">
                    {survey._count?.responses ?? 0} resp.
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                  <p>Creador: {survey.author?.name ?? 'N/D'}</p>
                  <p>Dirigida a: {survey.targetRoles.map(formatUserRole).join(', ')}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {survey.targetRoles.includes(user?.role || 'STUDENT') && (
                    <Link href={`/surveys/${survey.id}`} className="button-primary rounded-xl px-4 py-2 text-sm font-medium transition hover:shadow-md">
                      Responder
                    </Link>
                  )}

                  {(user?.role === 'ADMIN' || survey.author?.id === user?.id) && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleSurveyState(survey)}
                        disabled={busySurveyId === survey.id}
                        className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                      >
                        {busySurveyId === survey.id ? 'Procesando...' : 'Desactivar'}
                      </button>
                      <Link href={`/surveys/${survey.id}/edit`} className="rounded-xl border border-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition hover:bg-[var(--primary-soft)]">
                        Editar
                      </Link>
                      <Link href={`/surveys/${survey.id}/results`} className="rounded-xl border border-cyan-600 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50">
                        Resultados
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSurveyToDelete(survey)}
                        disabled={busySurveyId === survey.id}
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {busySurveyId === survey.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          {inactiveVisibleSurveys.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">Encuestas inactivas</h3>
                <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">{inactiveVisibleSurveys.length} inactivas</span>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {inactiveVisibleSurveys.map((survey) => (
                  <article key={survey.id} className="glass-card soft-enter rounded-2xl border border-[var(--border)] p-5 shadow-sm opacity-95">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[var(--foreground)]">{survey.title}</h3>
                        <p className="mt-2 text-sm text-[var(--muted)]">{survey.description}</p>
                      </div>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Inactiva</span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                      <p>Creador: {survey.author?.name ?? 'N/D'}</p>
                      <p>Dirigida a: {survey.targetRoles.map(formatUserRole).join(', ')}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {(user?.role === 'ADMIN' || survey.author?.id === user?.id) && (
                        <button
                          type="button"
                          onClick={() => toggleSurveyState(survey)}
                          disabled={busySurveyId === survey.id}
                          className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                        >
                          {busySurveyId === survey.id ? 'Procesando...' : 'Activar'}
                        </button>
                      )}

                      <Link href={`/surveys/${survey.id}/edit`} className="rounded-xl border border-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition hover:bg-[var(--primary-soft)]">
                        Editar
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSurveyToDelete(survey)}
                        disabled={busySurveyId === survey.id}
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {busySurveyId === survey.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>

        {surveyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Confirmar eliminación</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Vas a eliminar la encuesta
                <span className="font-semibold text-[var(--foreground)]"> {surveyToDelete.title}</span>.
                También se eliminarán preguntas y respuestas asociadas.
              </p>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSurveyToDelete(null)}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteSurvey(surveyToDelete.id);
                    setSurveyToDelete(null);
                  }}
                  disabled={busySurveyId === surveyToDelete.id}
                  className="rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {busySurveyId === surveyToDelete.id ? 'Eliminando...' : 'Eliminar encuesta'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
