import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { RoomsService } from '@modules/rooms/rooms.service';
import { CreateRoomDto } from '@modules/rooms/dto/create-room.dto';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('landlord')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.propertiesService.list(user.user_id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user.user_id, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.propertiesService.getById(id, user.user_id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.update(id, user.user_id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.propertiesService.delete(id, user.user_id);
  }

  // Co-landlord management (primary owner only)
  @Get(':id/co-landlords')
  getCoLandlords(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.propertiesService.getCoLandlords(id, user.user_id);
  }

  @Post(':id/co-landlords')
  addCoLandlord(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('email') email: string,
  ) {
    return this.propertiesService.addCoLandlord(id, user.user_id, email);
  }

  @Delete(':id/co-landlords/:userId')
  removeCoLandlord(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.propertiesService.removeCoLandlord(id, user.user_id, userId);
  }

  // Nested rooms routes under /properties/:propertyId/rooms
  @Get(':propertyId/rooms')
  listRooms(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomsService.listByProperty(propertyId, user.user_id);
  }

  @Post(':propertyId/rooms')
  createRoom(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.create(propertyId, user.user_id, dto);
  }
}
