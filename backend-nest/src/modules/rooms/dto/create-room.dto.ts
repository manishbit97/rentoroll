import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'Flat 101' })
  @IsString()
  name: string;

  @ApiProperty({ example: 8000 })
  @IsNumber()
  @IsPositive()
  base_rent: number;
}
