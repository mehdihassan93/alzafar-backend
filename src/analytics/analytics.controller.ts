import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get high-level dashboard stats (Revenue, Stock, Top Sellers)',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregated analytics data returned successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only Admins can access analytics',
  })
  async getDashboard() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('revenue/monthly')
  @ApiOperation({ summary: 'Get revenue trends by month' })
  @ApiResponse({
    status: 200,
    description: 'Monthly revenue labels and values returned successfully',
  })
  async getMonthlyRevenue() {
    return this.analyticsService.getRevenueByMonth();
  }
}
