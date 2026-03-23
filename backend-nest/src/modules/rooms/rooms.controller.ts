import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { AssignTenantDto } from './dto/assign-tenant.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';
import { SetVacatingDateDto } from './dto/set-vacating-date.dto';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('landlord')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.delete(id);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignTenantDto) {
    return this.roomsService.assignTenant(id, dto);
  }

  @Delete(':id/assign')
  removeAssignment(@Param('id') id: string) {
    return this.roomsService.removeTenant(id);
  }

  @Patch(':id/advance')
  updateAdvance(@Param('id') id: string, @Body() dto: UpdateAdvanceDto) {
    return this.roomsService.updateAdvance(id, dto.amount);
  }

  @Patch(':id/vacating')
  setVacatingDate(@Param('id') id: string, @Body() dto: SetVacatingDateDto) {
    return this.roomsService.setVacatingDate(id, new Date(dto.vacating_date));
  }

  @Delete(':id/vacating')
  clearVacatingDate(@Param('id') id: string) {
    return this.roomsService.clearVacatingDate(id);
  }
}
