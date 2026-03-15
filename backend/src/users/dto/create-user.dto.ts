import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El correo debe tener un formato valido (ej: usuario@dominio.com)' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @IsIn(['ADMIN', 'TEACHER', 'STUDENT'], {
    message: 'El rol debe ser ADMIN, TEACHER o STUDENT',
  })
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';

  @IsOptional()
  @IsString({ message: 'La contraseña temporal debe ser texto' })
  @MinLength(6, { message: 'La contraseña temporal debe tener al menos 6 caracteres' })
  temporaryPassword?: string;
}