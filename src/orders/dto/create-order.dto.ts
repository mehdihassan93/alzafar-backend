import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    product: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    price: number;
}

export class ShippingAddressDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    street: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    state: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    zipCode: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    country: string;
}

export class CreateOrderDto {
    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty({ type: ShippingAddressDto })
    @ValidateNested()
    @Type(() => ShippingAddressDto)
    shippingAddress: ShippingAddressDto;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    paymentMethod: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    discountCode?: string;
}
