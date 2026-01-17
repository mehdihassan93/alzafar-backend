import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new coupon (Admin only)' })
  async create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all coupons (Admin only)' })
  async findAll() {
    return this.couponsService.findAll();
  }

  @Post('validate/:code')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Validate a coupon code and get discount details' })
  async validate(@Param('code') code: string, @Body('amount') amount: number) {
    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'Valid order amount is required for validation',
      );
    }
    const coupon = await this.couponsService.validateCoupon(code, amount);
    const discountAmount = await this.couponsService.calculateDiscount(
      coupon,
      amount,
    );

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount: amount - discountAmount,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a coupon (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
