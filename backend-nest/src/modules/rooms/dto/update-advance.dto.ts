import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateAdvanceDto {
  @ApiProperty({ description: 'Security deposit amount (0 to clear)' })
  @IsNumber()
  @Min(0)
  amount: number;
}
