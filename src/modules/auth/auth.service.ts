import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ message: string; user: Partial<User> }> {
    const { email, dni, password, accepts_terms, ...userData } = registerDto;

    if (!accepts_terms) {
      throw new BadRequestException(
        'Debes aceptar el consentimiento informado para registrarte',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { dni }],
    });

    if (existingUser) {
      throw new ConflictException('El email o DNI ya están registrados');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    const newUser = this.userRepository.create({
      ...userData,
      email,
      dni,
      password: hashedPassword,
      email_verification_token: verificationToken,
      email_verification_expiry: verificationExpiry,
    });

    const savedUser = await this.userRepository.save(newUser);

    // TODO: enviar email real de verificación con verificationToken

    const {
      password: _,
      email_verification_token: __,
      email_verification_expiry: ___,
      password_reset_token,
      password_reset_expiry,
      ...publicUser
    } = savedUser;

    return {
      message: 'Usuario registrado exitosamente. Por favor verifica tu email.',
      user: publicUser,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ message: string; access_token: string; user: Partial<User> }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const lockedUntil = user.account_locked_until
      ? new Date(user.account_locked_until)
      : null;

    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil(
        (lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intenta nuevamente en ${minutesLeft} minutos`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      user.failed_login_attempts = (user.failed_login_attempts ?? 0) + 1;

      if (user.failed_login_attempts >= 3) {
        user.account_locked_until = new Date(Date.now() + 15 * 60 * 1000);
        await this.userRepository.save(user);
        throw new UnauthorizedException(
          'Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos',
        );
      }

      await this.userRepository.save(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.is_email_verified) {
      throw new UnauthorizedException(
        'Por favor verifica tu email antes de iniciar sesión',
      );
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Tu cuenta ha sido desactivada');
    }

    if ((user.failed_login_attempts ?? 0) > 0 || user.account_locked_until) {
      user.failed_login_attempts = 0;
      user.account_locked_until = null;
      await this.userRepository.save(user);
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    const { password: _, ...publicUser } = user;

    return {
      message: 'Inicio de sesión exitoso',
      access_token,
      user: publicUser,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email_verification_token: token },
    });

    if (!user) {
      throw new BadRequestException('Token de verificación inválido');
    }

    const expiry = user.email_verification_expiry
      ? new Date(user.email_verification_expiry)
      : null;

    if (!expiry || expiry.getTime() < Date.now()) {
      throw new BadRequestException(
        'Token de verificación expirado. Solicita uno nuevo',
      );
    }

    if (user.is_email_verified) {
      return {
        message: 'El email ya estaba verificado',
      };
    }

    user.is_email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expiry = null;

    await this.userRepository.save(user);

    return {
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión',
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + 1);

      user.password_reset_token = resetToken;
      user.password_reset_expiry = resetExpiry;

      await this.userRepository.save(user);

      // TODO: enviar email real con resetToken
    }

    return {
      message:
        'Si el email existe, recibirás instrucciones para recuperar tu contraseña',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, new_password } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { password_reset_token: token },
    });

    const expiry = user?.password_reset_expiry
      ? new Date(user.password_reset_expiry)
      : null;

    if (!user || !expiry || expiry.getTime() < Date.now()) {
      throw new BadRequestException('Token inválido o expirado');
    }

    user.password = await bcrypt.hash(new_password, 10);
    user.password_reset_token = null;
    user.password_reset_expiry = null;

    await this.userRepository.save(user);

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }
}
