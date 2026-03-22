import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignTenantDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  tenant_id: string;
}
