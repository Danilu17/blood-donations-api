// src/modules/certificates/dto/create-certificate.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, Length } from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty({
    description: 'ID de la donación asociada al certificado',
    example: 'b2b94f0e-1a8a-4a9a-9b5e-5c7c4b5b1234',
  })
  @IsUUID()
  donation_id: string;

  @ApiPropertyOptional({
    description:
      'Código de verificación del certificado (si no se envía, se genera uno automáticamente)',
    example: 'CERT-2025-000123',
  })
  @IsOptional()
  @IsString()
  @Length(4, 255)
  verification_code?: string;
}
