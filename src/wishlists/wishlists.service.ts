import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist } from './schemas/wishlist.schema';
import { CartsService } from '../carts/carts.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WishlistsService {
    private readonly MAX_WISHLISTS = 15;
    private readonly MAX_ITEMS_PER_WISHLIST = 100;

    constructor(
        @InjectModel(Wishlist.name) private wishlistModel: Model<Wishlist>,
        private cartsService: CartsService,
        private notificationsService: NotificationsService,
    ) { }

    async findAll(userId: string): Promise<Wishlist[]> {
        return this.wishlistModel.find({ user: new Types.ObjectId(userId) }).exec();
    }

    async create(userId: string, name: string): Promise<Wishlist> {
        const count = await this.wishlistModel.countDocuments({ user: new Types.ObjectId(userId) });
        if (count >= this.MAX_WISHLISTS) {
            throw new BadRequestException(`Maximum of ${this.MAX_WISHLISTS} wishlists allowed`);
        }

        const existing = await this.wishlistModel.findOne({ user: new Types.ObjectId(userId), name });
        if (existing) {
            throw new ConflictException('Wishlist with this name already exists');
        }

        return this.wishlistModel.create({
            user: new Types.ObjectId(userId),
            name,
            items: [],
        });
    }

    async addItem(userId: string, wishlistId: string, productId: string): Promise<Wishlist> {
        const wishlist = await this.wishlistModel.findOne({ _id: wishlistId, user: new Types.ObjectId(userId) });
        if (!wishlist) throw new NotFoundException('Wishlist not found');

        if (wishlist.items.some(id => id.toString() === productId)) {
            return wishlist; // Already in wishlist
        }

        if (wishlist.items.length >= this.MAX_ITEMS_PER_WISHLIST) {
            throw new BadRequestException(`Wishlist reached maximum limit of ${this.MAX_ITEMS_PER_WISHLIST} items`);
        }

        wishlist.items.push(new Types.ObjectId(productId) as any);
        return wishlist.save();
    }

    async removeItem(userId: string, wishlistId: string, productId: string): Promise<Wishlist> {
        const wishlist = await this.wishlistModel.findOne({ _id: wishlistId, user: new Types.ObjectId(userId) });
        if (!wishlist) throw new NotFoundException('Wishlist not found');

        wishlist.items = wishlist.items.filter(id => id.toString() !== productId);
        return wishlist.save();
    }

    async moveToCart(userId: string, wishlistId: string, productId: string, cartId: string): Promise<void> {
        const wishlist = await this.wishlistModel.findOne({ _id: wishlistId, user: new Types.ObjectId(userId) });
        if (!wishlist) throw new NotFoundException('Wishlist not found');

        const hasProduct = wishlist.items.some(id => id.toString() === productId);
        if (!hasProduct) throw new NotFoundException('Product not in wishlist');

        // Copy to cart
        await this.cartsService.addItem(userId, cartId, productId, 1);

        // Remove from wishlist (requirement says "Items copied to selected cart" then "Popup... Delete wishlist?")
        // Usually "Move" means remove from source, but copying is also requested. 
        // Let's implement copying first as per literal text, and keep item in wishlist.
    }

    async deleteWishlist(userId: string, wishlistId: string): Promise<void> {
        const result = await this.wishlistModel.deleteOne({ _id: wishlistId, user: new Types.ObjectId(userId) });
        if (result.deletedCount === 0) throw new NotFoundException('Wishlist not found');
    }

    async moveItemBetweenWishlists(userId: string, fromId: string, toId: string, productId: string): Promise<void> {
        const from = await this.wishlistModel.findOne({ _id: fromId, user: new Types.ObjectId(userId) });
        const to = await this.wishlistModel.findOne({ _id: toId, user: new Types.ObjectId(userId) });

        if (!from || !to) throw new NotFoundException('One or both wishlists not found');

        const productIndex = from.items.findIndex(id => id.toString() === productId);
        if (productIndex === -1) throw new NotFoundException('Product not in source wishlist');

        from.items.splice(productIndex, 1);

        if (!to.items.some(id => id.toString() === productId)) {
            if (to.items.length >= this.MAX_ITEMS_PER_WISHLIST) throw new BadRequestException('Destination wishlist is full');
            to.items.push(new Types.ObjectId(productId) as any);
        }

        await from.save();
        await to.save();
    }

    async removeProductFromAllWishlists(productId: string): Promise<void> {
        await this.wishlistModel.updateMany(
            {},
            { $pull: { items: new Types.ObjectId(productId) } }
        ).exec();
    }

    async notifyPriceDrop(productId: string, productName: string, newPrice: number): Promise<void> {
        const wishlists = await this.wishlistModel.find({ items: new Types.ObjectId(productId) }).populate('user');

        for (const wishlist of wishlists) {
            const userId = (wishlist.user as any)._id.toString();
            await this.notificationsService.create(
                userId,
                'Price Drop Alert! 📉',
                `Great news! '${productName}' in your wishlist is now available for just $${newPrice}.`,
                'PRICE_DROP',
                { productId, newPrice }
            );
        }
    }
}
