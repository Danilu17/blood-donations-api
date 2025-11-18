import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateVolunteerDto {
  @ApiProperty({
    description: 'User ID al que se le otorgará rol de voluntario',
  })
  @IsUUID()
  userId: string;
}
