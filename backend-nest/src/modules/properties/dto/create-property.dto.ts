import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Sunset Apartments' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '123 Main Street, Springfield' })
  @IsOptional()
  @IsString()
  address?: string;
}
