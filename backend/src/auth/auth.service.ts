import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private buildAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    role: any;
    mustChangePassword: boolean;
    isActive: boolean;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
    };

    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        isActive: user.isActive,
      },
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Usuario y/o contraseña incorrecto(s)');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tu usuario está inactivo. Contacta al administrador');
    }

    return this.buildAuthResponse(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario inválido');

    if (!bcrypt.compareSync(dto.currentPassword, user.password)) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: bcrypt.hashSync(dto.newPassword, 10),
        mustChangePassword: false,
      },
    });

    return this.buildAuthResponse(updated);
  }
}
