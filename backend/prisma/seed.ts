import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Idempotente: solo ejecuta si no hay datos
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('✅ Seed ya ejecutado previamente, omitiendo.');
    return;
  }

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@utb.edu',
      password: hash('admin123'),
      name: 'Administrador',
      role: Role.ADMIN,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: 'profesor@utb.edu',
      password: hash('profesor123'),
      name: 'Prof. García',
      role: Role.TEACHER,
    },
  });

  await prisma.user.create({
    data: {
      email: 'estudiante1@utb.edu',
      password: hash('estudiante123'),
      name: 'Ana López',
      role: Role.STUDENT,
    },
  });

  await prisma.user.create({
    data: {
      email: 'estudiante2@utb.edu',
      password: hash('estudiante123'),
      name: 'Carlos Ruiz',
      role: Role.STUDENT,
    },
  });

  // Encuesta dirigida a estudiantes
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

  // Encuesta dirigida a profesores y administrativos
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

  console.log('✅ Seed completado: 4 usuarios y 2 encuestas creadas.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
