import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@utb.edu' },
    update: {},
    create: {
      email: 'admin@utb.edu',
      password: hash('admin123'),
      name: 'Administrador',
      role: Role.ADMIN,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'profesor@utb.edu' },
    update: {},
    create: {
      email: 'profesor@utb.edu',
      password: hash('profesor123'),
      name: 'Prof. García',
      role: Role.TEACHER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'estudiante1@utb.edu' },
    update: {},
    create: {
      email: 'estudiante1@utb.edu',
      password: hash('estudiante123'),
      name: 'Ana López',
      role: Role.STUDENT,
    },
  });

  await prisma.user.upsert({
    where: { email: 'estudiante2@utb.edu' },
    update: {},
    create: {
      email: 'estudiante2@utb.edu',
      password: hash('estudiante123'),
      name: 'Carlos Ruiz',
      role: Role.STUDENT,
    },
  });

  // Encuesta dirigida a estudiantes
  const survey1Exists = await prisma.survey.findFirst({
    where: { title: 'Encuesta de satisfacción docente' },
    select: { id: true },
  });

  if (!survey1Exists) {
    await prisma.survey.create({
      data: {
        title: 'Encuesta de satisfacción docente',
        description: 'Evalúa la calidad de la enseñanza del semestre',
        targetRoles: [Role.STUDENT],
        authorId: teacher.id,
        questions: {
          create: [
            {
              text: '¿Cómo calificarías la claridad del profesor?',
              type: 'MULTIPLE_CHOICE',
              options: ['Excelente', 'Buena', 'Regular', 'Deficiente'],
              order: 1,
            },
            {
              text: '¿Con qué frecuencia se usan recursos multimedia?',
              type: 'MULTIPLE_CHOICE',
              options: ['Siempre', 'Casi siempre', 'A veces', 'Nunca'],
              order: 2,
            },
            {
              text: '¿Qué mejorarías de las clases?',
              type: 'OPEN_TEXT',
              options: [],
              order: 3,
            },
          ],
        },
      },
    });
  }

  // Encuesta dirigida a profesores y administrativos
  const survey2Exists = await prisma.survey.findFirst({
    where: { title: 'Evaluación de infraestructura institucional' },
    select: { id: true },
  });

  if (!survey2Exists) {
    await prisma.survey.create({
      data: {
        title: 'Evaluación de infraestructura institucional',
        description: 'Estado actual de las instalaciones y recursos disponibles',
        targetRoles: [Role.TEACHER, Role.ADMIN],
        authorId: admin.id,
        questions: {
          create: [
            {
              text: '¿Las aulas cuentan con los equipos necesarios?',
              type: 'MULTIPLE_CHOICE',
              options: ['Sí, completamente', 'Parcialmente', 'No'],
              order: 1,
            },
            {
              text: '¿Qué mejoras prioritarias recomiendas para el próximo semestre?',
              type: 'OPEN_TEXT',
              options: [],
              order: 2,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Seed completado: 4 usuarios y 2 encuestas creadas.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
