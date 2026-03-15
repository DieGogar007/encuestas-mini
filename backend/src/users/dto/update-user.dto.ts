import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El correo debe tener un formato valido (ej: usuario@dominio.com)' })
  email?: string;

  @IsOptional()
  @IsIn(['ADMIN', 'TEACHER', 'STUDENT'], {
    message: 'El rol debe ser ADMIN, TEACHER o STUDENT',
  })
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT';

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  isActive?: boolean;
}

export class ResetPasswordDto {
  @IsOptional()
  @IsString({ message: 'La contraseña temporal debe ser texto' })
  @MinLength(6, { message: 'La contraseña temporal debe tener al menos 6 caracteres' })
  temporaryPassword?: string;
}