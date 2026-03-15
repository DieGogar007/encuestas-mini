'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { Survey, User } from '@/lib/types';

export default function SurveyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);

  useEffect(() => {
    const token = getToken();
    const currentUser = getUser();
    if (!token) {
      router.replace('/login');
      return;
    }
    setUser(currentUser);

    apiFetch<Survey>(`/surveys/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setSurvey)
      .catch((err) => setStatus(err instanceof Error ? err.message : 'No se pudo cargar la encuesta'));

    apiFetch<{ responded: boolean }>(`/surveys/${params.id}/responses/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setHasResponded(data.responded);
        if (data.responded) {
          setStatus('Ya respondiste esta encuesta. No puedes enviar una segunda respuesta.');
        }
      })
      .catch(() => undefined);
  }, [params.id, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return router.push('/login');
    if (hasResponded) {
      setStatus('Ya respondiste esta encuesta. No puedes enviar una segunda respuesta.');
      return;
    }
    setLoading(true);
    setStatus('');

    try {
      await apiFetch(`/surveys/${params.id}/responses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
        }),
      });
      setHasResponded(true);
      setStatus('Encuesta respondida correctamente.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'No se pudo enviar la respuesta');
    } finally {
      setLoading(false);
    }
  }

  if (!survey) {
    return <main className="min-h-screen p-8">{status || 'Cargando encuesta...'}</main>;
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="glass-card soft-enter mx-auto max-w-3xl rounded-3xl border border-[var(--border)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{survey.title}</h1>
          {(user?.role === 'ADMIN' || survey.author?.id === user?.id) && (
            <button
              type="button"
              onClick={() => router.push(`/surveys/${survey.id}/edit`)}
              className="rounded-xl border border-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)]"
            >
              Editar encuesta
            </button>
          )}
        </div>
        <p className="mt-3 text-[var(--muted)]">{survey.description}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {survey.questions?.map((question) => (
            <div key={question.id} className="rounded-2xl border border-[var(--border)] bg-white/80 p-5">
              <p className="text-lg font-medium text-[var(--foreground)]">{question.order}. {question.text}</p>

              {question.type === 'MULTIPLE_CHOICE' ? (
                <div className="mt-4 space-y-3">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3 hover:bg-[var(--primary-soft)]/40">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="mt-4 w-full rounded-xl border border-[var(--border)] px-4 py-3"
                  rows={4}
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                />
              )}
            </div>
          ))}

          {status ? <p className="rounded-xl bg-blue-50 px-4 py-3 text-blue-800">{status}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button className="button-primary rounded-xl px-5 py-3 font-medium text-white disabled:opacity-60" type="submit" disabled={loading || hasResponded}>
              {loading ? 'Enviando...' : hasResponded ? 'Respuesta ya registrada' : 'Enviar respuestas'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard')} className="rounded-xl border border-[var(--border)] px-5 py-3 font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]">
              Volver
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
