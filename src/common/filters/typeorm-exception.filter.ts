import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch()
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let originalError: unknown = exception;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (
        res &&
        typeof res === 'object' &&
        ('cause' in res || 'originalError' in res)
      ) {
        originalError = (res as any)['cause'] || (res as any)['originalError'];
      }
    }

    if (originalError instanceof QueryFailedError) {
      const code =
        (originalError as any).code ||
        (originalError as any)?.driverError?.code ||
        String(
          (originalError as any).errno ||
            (originalError as any)?.driverError?.errno,
        );

      let nestException: HttpException;

      switch (code) {
        case 'ER_DUP_ENTRY':
        case '1062':
          nestException = new ConflictException(
            'Registro duplicado. Verifica los campos únicos (DNI, email).',
          );
          break;
        case 'ER_NO_REFERENCED_ROW_2':
        case '1452':
          nestException = new BadRequestException(
            'Violación de restricción de clave foránea',
          );
          break;
        case 'ER_ROW_IS_REFERENCED_2':
        case '1451':
          nestException = new BadRequestException(
            'No se puede eliminar debido a restricción de clave foránea',
          );
          break;
        case 'ER_BAD_NULL_ERROR':
        case '1048':
          nestException = new BadRequestException(
            'Campo requerido no puede ser nulo',
          );
          break;
        default:
          this.logger.error('Database error:', originalError);
          nestException = new HttpException(
            'Error en la base de datos',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }

      return response.status(nestException.getStatus()).json({
        statusCode: nestException.getStatus(),
        message: nestException.message,
        error: nestException.name,
      });
    }

    if (exception instanceof HttpException) {
      return response
        .status(exception.getStatus())
        .json(exception.getResponse());
    }

    this.logger.error('Unhandled exception:', exception);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
      error: 'Internal Server Error',
    });
  }
}
