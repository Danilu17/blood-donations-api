import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Correo electrónico asociado a la cuenta',
    example: 'usuario@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
