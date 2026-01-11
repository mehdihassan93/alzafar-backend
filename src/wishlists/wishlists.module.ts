import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistsService } from './wishlists.service';
import { WishlistsController } from './wishlists.controller';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { CartsModule } from '../carts/carts.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Wishlist.name, schema: WishlistSchema }]),
        CartsModule,
        AuthModule,
        NotificationsModule,
    ],
    providers: [WishlistsService],
    controllers: [WishlistsController],
    exports: [WishlistsService],
})
export class WishlistsModule { }
