import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class RecordPaymentDto {
  @ApiPropertyOptional({ description: 'Payment amount (omit to mark as fully paid)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'ISO date string of payment date' })
  @IsOptional()
  @IsDateString()
  paid_date?: string;
}
