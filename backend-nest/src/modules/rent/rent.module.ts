import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RentRecord,
  RentRecordSchema,
} from '@database/schemas/rent-record.schema';
import { Room, RoomSchema } from '@database/schemas/room.schema';
import {
  TenantAssignment,
  TenantAssignmentSchema,
} from '@database/schemas/tenant-assignment.schema';
import { User, UserSchema } from '@database/schemas/user.schema';
import { RentController } from './rent.controller';
import { TenantController } from './tenant.controller';
import { RentService } from './rent.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentRecord.name, schema: RentRecordSchema },
      { name: Room.name, schema: RoomSchema },
      { name: TenantAssignment.name, schema: TenantAssignmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RentController, TenantController],
  providers: [RentService],
})
export class RentModule {}
