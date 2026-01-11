import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { Cart, CartSchema } from './schemas/cart.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Cart.name, schema: CartSchema },
            { name: Product.name, schema: ProductSchema },
        ]),
        AuthModule,
    ],
    providers: [CartsService],
    controllers: [CartsController],
    exports: [CartsService],
})
export class CartsModule { }
