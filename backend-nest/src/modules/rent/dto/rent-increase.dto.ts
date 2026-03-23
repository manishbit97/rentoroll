import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class RentIncreaseDto {
  @ApiProperty({ description: 'New base rent amount' })
  @IsNumber()
  @Min(1)
  new_base_rent: number;

  @ApiProperty({ description: 'Month to apply increase from (1–12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  from_month: number;

  @ApiProperty({ description: 'Year to apply increase from' })
  @IsInt()
  @Min(2000)
  from_year: number;
}
