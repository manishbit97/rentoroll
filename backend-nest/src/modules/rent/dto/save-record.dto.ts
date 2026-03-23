import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SaveRecordDto {
  @ApiProperty()
  @IsString()
  room_id: string;

  @ApiProperty()
  @IsString()
  property_id: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  month: number;

  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsNumber()
  base_rent: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  electricity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
