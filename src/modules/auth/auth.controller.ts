import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { HTTP_STATUS } from '../../common/constants/http-status.constant';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: HTTP_STATUS.CREATED,
    description: 'Usuario registrado exitosamente',
  })
  @ApiResponse({
    status: HTTP_STATUS.CONFLICT,
    description: 'Email o DNI ya registrados',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200) // ← Fuerza el código 200 OK
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Inicio de sesión exitoso',
  })
  @ApiResponse({
    status: HTTP_STATUS.UNAUTHORIZED,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Token de recuperación generado',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Contraseña actualizada exitosamente',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
