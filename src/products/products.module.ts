import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { CartsModule } from '../carts/carts.module';
import { WishlistsModule } from '../wishlists/wishlists.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CartsModule,
    WishlistsModule,
    AuthModule,
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule { }
