type SurveyQuestionDraft = {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';
  options: string[];
};

type SurveyDraft = {
  title: string;
  description: string;
  questions: SurveyQuestionDraft[];
};

export function validateSurveyDraft(draft: SurveyDraft): string | null {
  if (!draft.title.trim()) {
    return 'El titulo de la encuesta es obligatorio.';
  }

  if (!draft.description.trim()) {
    return 'La descripcion de la encuesta es obligatoria.';
  }

  if (draft.questions.length === 0) {
    return 'Debes agregar al menos una pregunta.';
  }

  for (let index = 0; index < draft.questions.length; index++) {
    const question = draft.questions[index];

    if (!question.text.trim()) {
      return `La pregunta ${index + 1} no tiene texto. Completala o eliminala.`;
    }

    if (question.type === 'MULTIPLE_CHOICE') {
      const validOptions = question.options.map((option) => option.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        return `La pregunta ${index + 1} debe tener al menos dos opciones validas.`;
      }
    }
  }

  return null;
}
