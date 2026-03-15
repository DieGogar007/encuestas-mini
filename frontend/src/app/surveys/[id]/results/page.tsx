'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { formatUserRole, SurveyResponse } from '@/lib/types';

type ResultQuestion = {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';
  tally?: Record<string, number>;
  answers?: string[];
};

type Results = {
  survey: { id: string; title: string; description: string };
  totalResponses: number;
  questions: ResultQuestion[];
};

export default function SurveyResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [results, setResults] = useState<Results | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [error, setError] = useState('');
  const [busyResponseId, setBusyResponseId] = useState('');
  const [responseToDelete, setResponseToDelete] = useState<SurveyResponse | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    apiFetch<Results>(`/surveys/${params.id}/results`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setResults)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los resultados'));

    apiFetch<SurveyResponse[]>(`/surveys/${params.id}/responses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setResponses)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las respuestas'));
  }, [params.id, router]);

  async function deleteResponse(responseId: string) {
    const token = getToken();
    if (!token) return router.push('/login');

    try {
      setBusyResponseId(responseId);
      await apiFetch<{ message: string }>(`/surveys/${params.id}/responses/${responseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const [freshResults, freshResponses] = await Promise.all([
        apiFetch<Results>(`/surveys/${params.id}/results`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch<SurveyResponse[]>(`/surveys/${params.id}/responses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setResults(freshResults);
      setResponses(freshResponses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la respuesta');
    } finally {
      setBusyResponseId('');
    }
  }

  if (error) {
    return <main className="min-h-screen p-8 text-red-700">{error}</main>;
  }

  if (!results) {
    return <main className="min-h-screen p-8">Cargando resultados...</main>;
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="glass-card soft-enter mx-auto max-w-5xl rounded-3xl border border-[var(--border)] p-6 shadow-sm sm:p-8">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]"
          >
            Volver
          </button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{results.survey.title}</h1>
            <p className="mt-3 text-[var(--muted)]">{results.survey.description}</p>
          </div>
          <span className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--primary)]">
            {results.totalResponses} respuestas
          </span>
        </div>

        <div className="mt-8 space-y-6">
          {results.questions.map((question) => (
            <section key={question.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{question.text}</h2>

              {question.type === 'MULTIPLE_CHOICE' ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(question.tally || {}).map(([option, count]) => (
                    <div key={option} className="rounded-xl bg-blue-50 px-4 py-3">
                      <p className="font-medium text-blue-900">{option}</p>
                      <p className="text-sm text-blue-700">{count} votos</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {(question.answers || []).length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Sin respuestas aún.</p>
                  ) : (
                    (question.answers || []).map((answer, index) => (
                      <div key={index} className="rounded-xl bg-cyan-50 px-4 py-3 text-cyan-900">
                        {answer}
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Gestión de respuestas</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Puedes eliminar respuestas individuales cuando lo necesites.</p>

          <div className="mt-4 space-y-4">
            {responses.map((response) => (
              <article key={response.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--foreground)]">
                    <span className="font-semibold">{response.user.name}</span> ({formatUserRole(response.user.role)}) - {response.user.email}
                  </p>
                  <button
                    type="button"
                    onClick={() => setResponseToDelete(response)}
                    disabled={busyResponseId === response.id}
                    className="rounded-xl border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {busyResponseId === response.id ? 'Eliminando...' : 'Eliminar respuesta'}
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {response.answers
                    .slice()
                    .sort((a, b) => a.question.order - b.question.order)
                    .map((answer) => (
                      <div key={answer.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <p className="font-medium text-slate-700">{answer.question.text}</p>
                        <p className="mt-1 text-slate-600">{answer.value}</p>
                      </div>
                    ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {responseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Confirmar eliminación</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Vas a eliminar la respuesta de
                <span className="font-semibold text-[var(--foreground)]"> {responseToDelete.user.name}</span>.
                Esta acción no se puede deshacer.
              </p>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResponseToDelete(null)}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteResponse(responseToDelete.id);
                    setResponseToDelete(null);
                  }}
                  disabled={busyResponseId === responseToDelete.id}
                  className="rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {busyResponseId === responseToDelete.id ? 'Eliminando...' : 'Eliminar respuesta'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
