import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class SetVacatingDateDto {
  @ApiProperty({ description: 'Planned vacating date (ISO date string)' })
  @IsDateString()
  vacating_date: string;
}
