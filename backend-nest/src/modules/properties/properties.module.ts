import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from '@database/schemas/property.schema';
import { User, UserSchema } from '@database/schemas/user.schema';
import { RoomsModule } from '@modules/rooms/rooms.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: User.name, schema: UserSchema },
    ]),
    RoomsModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
