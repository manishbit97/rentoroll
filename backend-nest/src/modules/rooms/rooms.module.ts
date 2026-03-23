import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from '@database/schemas/room.schema';
import { Property, PropertySchema } from '@database/schemas/property.schema';
import {
  TenantAssignment,
  TenantAssignmentSchema,
} from '@database/schemas/tenant-assignment.schema';
import { User, UserSchema } from '@database/schemas/user.schema';
import {
  RentRecord,
  RentRecordSchema,
} from '@database/schemas/rent-record.schema';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Property.name, schema: PropertySchema },
      { name: TenantAssignment.name, schema: TenantAssignmentSchema },
      { name: User.name, schema: UserSchema },
      { name: RentRecord.name, schema: RentRecordSchema },
    ]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService, MongooseModule],
})
export class RoomsModule {}
