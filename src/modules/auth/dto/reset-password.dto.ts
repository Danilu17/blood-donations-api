import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-de-recuperacion-abc123' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NuevoPassword123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'La contraseña debe incluir mayúscula, minúscula y número',
  })
  new_password: string;
}
