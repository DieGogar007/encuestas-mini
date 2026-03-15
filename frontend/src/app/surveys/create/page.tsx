'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { validateSurveyDraft } from '@/lib/survey-validation';
import { formatUserRole, UserRole } from '@/lib/types';

type QuestionForm = {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';
  options: string[];
};

export default function CreateSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetRoles, setTargetRoles] = useState<UserRole[]>(['STUDENT']);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { text: '', type: 'MULTIPLE_CHOICE', options: ['Opcion 1'] },
  ]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);

  function toggleRole(role: UserRole) {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role],
    );
  }

  function updateQuestion(index: number, partial: Partial<QuestionForm>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...partial } : q)));
  }

  function changeQuestionType(index: number, type: QuestionForm['type']) {
    setQuestions((prev) =>
      prev.map((question, i) => {
        if (i !== index) return question;
        return {
          ...question,
          type,
          options: type === 'MULTIPLE_CHOICE' ? (question.options.length > 0 ? question.options : ['Opcion 1']) : [],
        };
      }),
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { text: '', type: 'OPEN_TEXT', options: [] }]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function duplicateQuestion(index: number) {
    setQuestions((prev) => {
      const question = prev[index];
      const clone = { ...question, options: [...question.options] };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option, currentIndex) =>
            currentIndex === optionIndex ? value : option,
          ),
        };
      }),
    );
  }

  function addOption(questionIndex: number) {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === questionIndex
          ? { ...question, options: [...question.options, `Opcion ${question.options.length + 1}`] }
          : question,
      ),
    );
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;
        const nextOptions = question.options.filter((_, currentIndex) => currentIndex !== optionIndex);
        return { ...question, options: nextOptions.length > 0 ? nextOptions : ['Opcion 1'] };
      }),
    );
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return router.push('/login');

    const validationError = validateSurveyDraft({ title, description, questions });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      await apiFetch('/surveys', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          description,
          targetRoles,
          questions: questions.map((q, index) => ({
            text: q.text,
            type: q.type,
            options: q.type === 'MULTIPLE_CHOICE' ? q.options.map((item) => item.trim()).filter(Boolean) : [],
            order: index + 1,
          })),
        }),
      });
      setStatus('Encuesta creada con éxito. Redirigiendo al dashboard...');
      setTimeout(() => router.push('/dashboard?created=1'), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la encuesta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="glass-card soft-enter mx-auto max-w-4xl rounded-3xl border border-[var(--border)] p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Crear encuesta</h1>
        <p className="mt-2 text-[var(--muted)]">Diseña una encuesta breve y dirígela al público adecuado.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Título</label>
              <input className="w-full rounded-xl border border-[var(--border)] px-4 py-3" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Descripción</label>
              <textarea className="w-full rounded-xl border border-[var(--border)] px-4 py-3" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Público objetivo</p>
            <div className="flex flex-wrap gap-3">
              {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((role) => (
                <label key={role} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3">
                  <input type="checkbox" checked={targetRoles.includes(role)} onChange={() => toggleRole(role)} />
                  <span>{formatUserRole(role)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Preguntas</h2>
              <button type="button" onClick={addQuestion} className="rounded-xl border border-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition hover:bg-[var(--primary-soft)]">
                Agregar pregunta
              </button>
            </div>

            {questions.map((question, index) => (
              <div key={index} className="rounded-2xl border border-[var(--border)] bg-white/80 p-5">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--muted)]">Pregunta {index + 1}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, -1)}
                        disabled={index === 0}
                        className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, 1)}
                        disabled={index === questions.length - 1}
                        className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)] disabled:opacity-40"
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateQuestion(index)}
                        className="rounded-lg border border-cyan-300 px-3 py-1 text-xs font-medium text-cyan-800 hover:bg-cyan-50"
                      >
                        Duplicar
                      </button>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setQuestionToDelete(index)}
                          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Texto de la pregunta</label>
                    <input
                      className="w-full rounded-xl border border-[var(--border)] px-4 py-3"
                      value={question.text}
                      onChange={(e) => updateQuestion(index, { text: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Tipo</label>
                    <select
                      className="w-full rounded-xl border border-[var(--border)] px-4 py-3"
                      value={question.type}
                      onChange={(e) => changeQuestionType(index, e.target.value as QuestionForm['type'])}
                    >
                      <option value="MULTIPLE_CHOICE">Opción múltiple</option>
                      <option value="OPEN_TEXT">Texto abierto</option>
                    </select>
                  </div>

                  {question.type === 'MULTIPLE_CHOICE' && (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium">Opciones</label>
                        <button
                          type="button"
                          onClick={() => addOption(index)}
                          className="rounded-lg border border-cyan-300 px-3 py-1 text-xs font-medium text-cyan-800 hover:bg-cyan-50"
                        >
                          Agregar opcion
                        </button>
                      </div>

                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <div key={`${index}-${optionIndex}`} className="flex items-center gap-3">
                            <span className="text-sm text-[var(--muted)]">{optionIndex + 1}.</span>
                            <input
                              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              placeholder={`Opcion ${optionIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(index, optionIndex)}
                              className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
          {status ? <p className="rounded-xl bg-blue-50 px-4 py-3 text-blue-800">{status}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button className="button-primary rounded-xl px-5 py-3 font-medium text-white" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar encuesta'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard')} className="rounded-xl border border-[var(--border)] px-5 py-3 font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]">
              Cancelar
            </button>
          </div>
        </form>

        {questionToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Confirmar eliminación</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Vas a eliminar la pregunta
                <span className="font-semibold text-[var(--foreground)]"> {questionToDelete + 1}</span>.
                Esta acción quitará su contenido del formulario actual.
              </p>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setQuestionToDelete(null)}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeQuestion(questionToDelete);
                    setQuestionToDelete(null);
                  }}
                  className="rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Eliminar pregunta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
