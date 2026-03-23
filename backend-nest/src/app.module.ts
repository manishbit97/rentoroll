import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from '@config/app.config';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { PropertiesModule } from '@modules/properties/properties.module';
import { RoomsModule } from '@modules/rooms/rooms.module';
import { RentModule } from '@modules/rent/rent.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 1000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    PropertiesModule,
    RoomsModule,
    RentModule,
    UsersModule,
  ],
})
export class AppModule {}
