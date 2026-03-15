import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';

@Injectable()
export class ResponsesService {
  constructor(private prisma: PrismaService) {}

  private async getSurveyWithQuestions(surveyId: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (!survey) throw new NotFoundException('Encuesta no encontrada');
    return survey;
  }

  private validateAnswers(
    survey: Awaited<ReturnType<ResponsesService['getSurveyWithQuestions']>>,
    answers: Array<{ questionId: string; value: string }>,
  ) {
    const validQuestionIds = new Set(survey.questions.map((question) => question.id));
    const providedQuestionIds = new Set(answers.map((answer) => answer.questionId));

    if (providedQuestionIds.size !== survey.questions.length) {
      throw new BadRequestException('Debes responder todas las preguntas de la encuesta');
    }

    for (const answer of answers) {
      const question = survey.questions.find((item) => item.id === answer.questionId);

      if (!validQuestionIds.has(answer.questionId) || !question) {
        throw new BadRequestException('Hay respuestas con preguntas inválidas');
      }

      if (question.type === 'MULTIPLE_CHOICE' && !question.options.includes(answer.value)) {
        throw new BadRequestException('Una o más respuestas no coinciden con las opciones permitidas');
      }

      if (question.type === 'OPEN_TEXT' && !answer.value.trim()) {
        throw new BadRequestException('Las respuestas abiertas no pueden estar vacías');
      }
    }
  }

  private async assertCanManageSurveyResponses(surveyId: string, userId: string, userRole: string) {
    const survey = await this.prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Encuesta no encontrada');

    if (userRole !== 'ADMIN' && survey.authorId !== userId) {
      throw new ForbiddenException('No tienes permisos para gestionar respuestas de esta encuesta');
    }

    return survey;
  }

  async create(surveyId: string, userId: string, userRole: string, dto: CreateResponseDto) {
    const survey = await this.getSurveyWithQuestions(surveyId);

    if (!survey.targetRoles.includes(userRole as any)) {
      throw new ForbiddenException('Tu rol no puede responder esta encuesta');
    }

    const existing = await this.prisma.response.findUnique({
      where: { userId_surveyId: { userId, surveyId } },
    });
    if (existing) throw new ConflictException('Ya respondiste esta encuesta');

    this.validateAnswers(survey, dto.answers);

    return this.prisma.response.create({
      data: {
        userId,
        surveyId,
        answers: {
          create: dto.answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
    });
  }

  async hasResponded(surveyId: string, userId: string) {
    const response = await this.prisma.response.findUnique({
      where: { userId_surveyId: { userId, surveyId } },
    });
    return { responded: !!response };
  }

  async listBySurvey(surveyId: string, userId: string, userRole: string) {
    await this.assertCanManageSurveyResponses(surveyId, userId, userRole);

    return this.prisma.response.findMany({
      where: { surveyId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        answers: {
          include: {
            question: { select: { id: true, text: true, type: true, order: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneBySurvey(
    surveyId: string,
    responseId: string,
    userId: string,
    userRole: string,
  ) {
    const response = await this.prisma.response.findFirst({
      where: { id: responseId, surveyId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        answers: {
          include: {
            question: { select: { id: true, text: true, type: true, order: true } },
          },
        },
      },
    });

    if (!response) throw new NotFoundException('Respuesta no encontrada');

    const survey = await this.prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Encuesta no encontrada');

    const canView =
      userRole === 'ADMIN' || response.userId === userId || survey.authorId === userId;

    if (!canView) {
      throw new ForbiddenException('No tienes permisos para ver esta respuesta');
    }

    return response;
  }

  async update(
    surveyId: string,
    responseId: string,
    userId: string,
    userRole: string,
    dto: UpdateResponseDto,
  ) {
    const survey = await this.getSurveyWithQuestions(surveyId);

    const response = await this.prisma.response.findFirst({ where: { id: responseId, surveyId } });
    if (!response) throw new NotFoundException('Respuesta no encontrada');

    const surveyAuthor = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      select: { authorId: true },
    });

    const canEdit =
      userRole === 'ADMIN' || response.userId === userId || surveyAuthor?.authorId === userId;
    if (!canEdit) {
      throw new ForbiddenException('No tienes permisos para editar esta respuesta');
    }

    this.validateAnswers(survey, dto.answers);

    return this.prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({ where: { responseId } });
      return tx.response.update({
        where: { id: responseId },
        data: {
          answers: {
            create: dto.answers.map((answer) => ({
              questionId: answer.questionId,
              value: answer.value,
            })),
          },
        },
        include: {
          answers: true,
        },
      });
    });
  }

  async delete(surveyId: string, responseId: string, userId: string, userRole: string) {
    const response = await this.prisma.response.findFirst({ where: { id: responseId, surveyId } });
    if (!response) throw new NotFoundException('Respuesta no encontrada');

    const canDelete = userRole === 'ADMIN' || response.userId === userId;
    if (!canDelete) {
      const survey = await this.prisma.survey.findUnique({ where: { id: surveyId } });
      const isAuthor = !!survey && survey.authorId === userId;
      if (!isAuthor) {
        throw new ForbiddenException('No tienes permisos para eliminar esta respuesta');
      }
    }

    await this.prisma.response.delete({ where: { id: responseId } });
    return { message: 'Respuesta eliminada correctamente' };
  }
}
