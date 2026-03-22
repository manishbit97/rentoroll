import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { RentService } from './rent.service';
import { SaveRecordDto } from './dto/save-record.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@ApiTags('rent')
@ApiBearerAuth()
@Controller('rent')
export class RentController {
  constructor(private readonly rentService: RentService) {}

  // ── Landlord routes ──────────────────────────────────────────

  // IMPORTANT: 'room/:roomId' MUST be declared before ':id' to avoid ambiguity
  @Get('room/:roomId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord')
  getRoomHistory(@Param('roomId') roomId: string) {
    return this.rentService.getRoomHistory(roomId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord')
  getMonthly(
    @Query('propertyId') propertyId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.rentService.getMonthlyForProperty(
      propertyId,
      parseInt(month, 10),
      parseInt(year, 10),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord')
  saveRecord(@Body() dto: SaveRecordDto) {
    return this.rentService.saveRecord(dto);
  }

  @Patch(':id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord')
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const paidDate = dto.paid_date ? new Date(dto.paid_date) : new Date();
    return this.rentService.recordPayment(
      id,
      dto.amount,
      paidDate,
      user.user_id,
      user.email,
    );
  }

  // ── Tenant routes ────────────────────────────────────────────

  @Get('my/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant')
  getMyHistory(@CurrentUser() user: JwtPayload) {
    return this.rentService.getMyHistory(user.user_id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant')
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
}
