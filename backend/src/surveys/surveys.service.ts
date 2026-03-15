import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  UpdateSurveyDto,
} from './dto/update-survey.dto';

@Injectable()
export class SurveysService {
  constructor(private prisma: PrismaService) {}

  private assertSurveyTextFields(title?: string, description?: string) {
    if (title !== undefined && !title.trim()) {
      throw new BadRequestException('El título de la encuesta es obligatorio');
    }

    if (description !== undefined && !description.trim()) {
      throw new BadRequestException('La descripción de la encuesta es obligatoria');
    }
  }

  private normalizeQuestionOptions(options: string[] | undefined) {
    return (options || []).map((option) => option.trim()).filter(Boolean);
  }

  private validateQuestionPayload(
    question: { text: string; type: string; options: string[] },
    index: number,
  ) {
    if (!question.text.trim()) {
      throw new BadRequestException(`La pregunta ${index + 1} no tiene texto`);
    }

    if (question.type === 'MULTIPLE_CHOICE') {
      const validOptions = this.normalizeQuestionOptions(question.options);
      if (validOptions.length < 2) {
        throw new BadRequestException(
          `La pregunta ${index + 1} debe tener al menos dos opciones válidas`,
        );
      }
      return validOptions;
    }

    return [];
  }

  private validateQuestionsOrThrow(
    questions: Array<{ text: string; type: string; options: string[]; order?: number }> | undefined,
  ) {
    if (!questions || questions.length === 0) {
      throw new BadRequestException('Debes agregar al menos una pregunta');
    }

    return questions.map((question, index) => ({
      ...question,
      text: question.text.trim(),
      options: this.validateQuestionPayload(question, index),
    }));
  }

  private async getSurveyOrThrow(id: string) {
    const survey = await this.prisma.survey.findUnique({ where: { id } });
    if (!survey) throw new NotFoundException('Encuesta no encontrada');
    return survey;
  }

  private async assertCanManageSurvey(id: string, userId: string, userRole: string) {
    const survey = await this.getSurveyOrThrow(id);
    if (userRole !== 'ADMIN' && survey.authorId !== userId) {
      throw new ForbiddenException('No tienes permisos para gestionar esta encuesta');
    }
    return survey;
  }

  async create(dto: CreateSurveyDto, authorId: string) {
    this.assertSurveyTextFields(dto.title, dto.description);
    const normalizedQuestions = this.validateQuestionsOrThrow(dto.questions);

    return this.prisma.survey.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        targetRoles: dto.targetRoles as any,
        authorId,
        questions: {
          create: normalizedQuestions.map((q, i) => ({
            text: q.text,
            type: q.type as any,
            options: q.options,
            order: q.order ?? i + 1,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  async findAvailable(userId: string, userRole: string) {
    return this.prisma.survey.findMany({
      where: {
        OR: [
          {
            isActive: true,
            targetRoles: { has: userRole as any },
          },
          { authorId: userId },
        ],
      },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.survey.findMany({
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        author: { select: { id: true, name: true } },
      },
    });

    if (!survey) throw new NotFoundException('Encuesta no encontrada');

    const targetRoles = Array.isArray(survey.targetRoles) ? survey.targetRoles : [];

    const canAccessRole =
      userRole === 'ADMIN' ||
      survey.author.id === userId ||
      targetRoles.includes(userRole as any);

    if (!canAccessRole) {
      throw new ForbiddenException('No tienes permiso para ver esta encuesta');
    }

    // Si la encuesta está inactiva, solo admin o dueño pueden verla.
    if (!survey.isActive && userRole !== 'ADMIN' && survey.author.id !== userId) {
      throw new ForbiddenException('Esta encuesta está inactiva');
    }

    return survey;
  }

  async update(id: string, dto: UpdateSurveyDto, userId: string, userRole: string) {
    const survey = await this.assertCanManageSurvey(id, userId, userRole);
    this.assertSurveyTextFields(dto.title, dto.description);

    if (dto.isActive !== undefined && survey.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Solo el dueño de la encuesta puede cambiar su estado');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.questions) {
        const normalizedQuestions = this.validateQuestionsOrThrow(dto.questions as any);

        const existingQuestions = await tx.question.findMany({
          where: { surveyId: id },
          select: { id: true },
        });

        const existingIds = new Set(existingQuestions.map((question) => question.id));
        const incomingIds = new Set(
          dto.questions
            .map((question) => question.id)
            .filter((questionId): questionId is string => !!questionId),
        );

        const questionIdsToDelete = [...existingIds].filter(
          (questionId) => !incomingIds.has(questionId),
        );

        if (questionIdsToDelete.length > 0) {
          await tx.answer.deleteMany({ where: { questionId: { in: questionIdsToDelete } } });
          await tx.question.deleteMany({ where: { id: { in: questionIdsToDelete } } });
        }

        for (let index = 0; index < normalizedQuestions.length; index++) {
          const question = normalizedQuestions[index] as any;
          const payload = {
            text: question.text,
            type: question.type as any,
            options: question.options,
            order: question.order ?? index + 1,
          };

          if (question.id) {
            if (!existingIds.has(question.id)) {
              throw new BadRequestException('Se intentó actualizar una pregunta inexistente');
            }

            await tx.question.update({ where: { id: question.id }, data: payload });
          } else {
            await tx.question.create({ data: { ...payload, surveyId: id } });
          }
        }
      }

      await tx.survey.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          description: dto.description?.trim(),
          targetRoles: dto.targetRoles as any,
          isActive: dto.isActive,
        },
      });

      return tx.survey.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, name: true } },
          questions: { orderBy: { order: 'asc' } },
          _count: { select: { responses: true } },
        },
      });
    });
  }

  async delete(id: string, userId: string, userRole: string) {
    await this.assertCanManageSurvey(id, userId, userRole);
    await this.prisma.survey.delete({ where: { id } });
    return { message: 'Encuesta eliminada correctamente' };
  }

  async addQuestion(
    surveyId: string,
    dto: CreateQuestionDto,
    userId: string,
    userRole: string,
  ) {
    await this.assertCanManageSurvey(surveyId, userId, userRole);

    const count = await this.prisma.question.count({ where: { surveyId } });
    return this.prisma.question.create({
      data: {
        surveyId,
        text: dto.text,
        type: dto.type as any,
        options: dto.options,
        order: dto.order ?? count + 1,
      },
    });
  }

  async updateQuestion(
    surveyId: string,
    questionId: string,
    dto: UpdateQuestionDto,
    userId: string,
    userRole: string,
  ) {
    await this.assertCanManageSurvey(surveyId, userId, userRole);

    const question = await this.prisma.question.findFirst({ where: { id: questionId, surveyId } });
    if (!question) throw new NotFoundException('Pregunta no encontrada');

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        text: dto.text,
        type: dto.type as any,
        options: dto.options,
        order: dto.order,
      },
    });
  }

  async deleteQuestion(surveyId: string, questionId: string, userId: string, userRole: string) {
    await this.assertCanManageSurvey(surveyId, userId, userRole);

    const question = await this.prisma.question.findFirst({ where: { id: questionId, surveyId } });
    if (!question) throw new NotFoundException('Pregunta no encontrada');

    await this.prisma.answer.deleteMany({ where: { questionId } });
    await this.prisma.question.delete({ where: { id: questionId } });

    return { message: 'Pregunta eliminada correctamente' };
  }

  async getResults(id: string, userId: string, userRole: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: { author: { select: { id: true } } },
    });

    if (!survey) throw new NotFoundException('Encuesta no encontrada');

    if (survey.author.id !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para ver los resultados');
    }

    const questions = await this.prisma.question.findMany({
      where: { surveyId: id },
      include: { answers: { select: { value: true } } },
      orderBy: { order: 'asc' },
    });

    const totalResponses = await this.prisma.response.count({
      where: { surveyId: id },
    });

    return {
      survey: { id: survey.id, title: survey.title, description: survey.description },
      totalResponses,
      questions: questions.map((q) => {
        if (q.type === 'MULTIPLE_CHOICE') {
          const tally: Record<string, number> = {};
          const options = Array.isArray(q.options) ? q.options : [];
          options.forEach((opt) => (tally[opt] = 0));
          q.answers.forEach((a) => {
            if (tally[a.value] !== undefined) tally[a.value]++;
          });
          return { id: q.id, text: q.text, type: q.type, tally };
        }

        return {
          id: q.id,
          text: q.text,
          type: q.type,
          answers: q.answers.map((a) => a.value),
        };
      }),
    };
  }
}
