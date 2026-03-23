import { Body, Controller, Delete, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { RentService } from './rent.service';
import { SetVacatingDateDto } from '../rooms/dto/set-vacating-date.dto';

@ApiTags('tenant')
@ApiBearerAuth()
@Controller('tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant')
export class TenantController {
  constructor(private readonly rentService: RentService) {}

  @Get('rent')
  getMyRent(
    @CurrentUser() user: JwtPayload,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    return this.rentService.getMyRent(user.user_id, m, y);
  }

  @Get('history')
  getMyHistory(@CurrentUser() user: JwtPayload) {
    return this.rentService.getMyHistory(user.user_id);
  }

  @Patch('vacating')
  setVacatingDate(@CurrentUser() user: JwtPayload, @Body() dto: SetVacatingDateDto) {
    return this.rentService.setMyVacatingDate(user.user_id, new Date(dto.vacating_date));
  }

  @Delete('vacating')
  clearVacatingDate(@CurrentUser() user: JwtPayload) {
    return this.rentService.clearMyVacatingDate(user.user_id);
  }
}
