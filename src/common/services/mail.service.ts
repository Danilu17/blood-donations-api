import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Servicio genérico para enviar correos electrónicos.
 * Se apoya en Nodemailer y lee las credenciales desde variables de entorno.
 */
@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  /**
   * Envía el correo de verificación de email.  Construye un enlace con la URL
   * del frontend y el token recibido.  Los textos pueden personalizarse
   * posteriormente según las necesidades.
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    const html = `
      <p>Hola,</p>
      <p>Gracias por registrarte. Por favor haz clic en el siguiente enlace para verificar tu dirección de correo electrónico:</p>
      <p><a href="${verifyUrl}">Verificar correo</a></p>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
    `;
    await this.sendMail({
      to,
      subject: 'Verificación de correo electrónico',
      html,
    });
  }

  /**
   * Envía el correo de restablecimiento de contraseña.  De igual manera,
   * construye un enlace al frontend con el token para restablecer la contraseña.
   */
  async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const html = `
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el enlace a continuación para crear una nueva contraseña:</p>
      <p><a href="${resetUrl}">Restablecer contraseña</a></p>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `;
    await this.sendMail({
      to,
      subject: 'Restablecimiento de contraseña',
      html,
    });
  }

  /**
   * Método interno que envía un correo genérico utilizando el transporte de
   * Nodemailer.  También captura y registra posibles errores.
   */
  private async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM');
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error('Error enviando correo', error);
    }
  }
}
