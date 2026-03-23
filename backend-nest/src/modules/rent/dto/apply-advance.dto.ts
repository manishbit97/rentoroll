import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ApplyAdvanceDto {
  @ApiProperty({ description: 'Rent record ID to apply advance against' })
  @IsMongoId()
  rent_record_id: string;
}
