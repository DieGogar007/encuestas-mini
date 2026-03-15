import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto, UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private sanitizeUser<T extends { password?: string }>(user: T) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private generateTemporaryPassword() {
    return `UTB${Math.random().toString(36).slice(-8)}!`;
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.sanitizeUser(user);
  }

  async listAll() {
    const users = await this.prisma.user.findMany({
      orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { name: 'asc' }],
    });
    return users.map((user) => this.sanitizeUser(user));
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con este correo');

    const temporaryPassword = dto.temporaryPassword || this.generateTemporaryPassword();

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role as any,
        password: bcrypt.hashSync(temporaryPassword, 10),
        mustChangePassword: true,
        isActive: true,
      },
    });

    return {
      user: this.sanitizeUser(user),
      temporaryPassword,
    };
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== existing.email) {
      const another = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (another) throw new ConflictException('Ya existe un usuario con este correo');
    }

    if (currentUserId === id && dto.isActive === false) {
      throw new BadRequestException('No puedes desactivar tu propio usuario');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role as any,
        isActive: dto.isActive,
      },
    });

    return this.sanitizeUser(updated);
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    const temporaryPassword = dto.temporaryPassword || this.generateTemporaryPassword();

    await this.prisma.user.update({
      where: { id },
      data: {
        password: bcrypt.hashSync(temporaryPassword, 10),
        mustChangePassword: true,
      },
    });

    return {
      message: 'Contraseña temporal generada correctamente',
      temporaryPassword,
    };
  }
}