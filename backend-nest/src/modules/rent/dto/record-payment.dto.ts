import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class RecordPaymentDto {
  @ApiPropertyOptional({ description: 'Payment amount (omit to mark as fully paid)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ description: 'ISO date string of payment date' })
  @IsOptional()
  @IsDateString()
  paid_date?: string;
}
