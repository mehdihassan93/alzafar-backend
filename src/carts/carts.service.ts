import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Cart } from './schemas/cart.schema';
import { Product } from '../products/schemas/product.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class CartsService {
  private readonly MAX_CARTS: number;
  private readonly MAX_ITEMS_PER_CART: number;

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {
    this.MAX_CARTS = this.configService.get<number>('MAX_CARTS') || 10;
    this.MAX_ITEMS_PER_CART =
      this.configService.get<number>('MAX_ITEMS_PER_CART') || 50;
  }

  async getOrCreateDefaultCart(userId: string): Promise<Cart> {
    let cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
      isDefault: true,
    });
    if (!cart) {
      cart = await this.cartModel.create({
        user: new Types.ObjectId(userId),
        name: 'Cart',
        isDefault: true,
        items: [],
      });
    }
    return cart;
  }

  async findAll(userId: string): Promise<Cart[]> {
    await this.getOrCreateDefaultCart(userId); // Ensure default exists
    return this.cartModel
      .find({
        $or: [
          { user: new Types.ObjectId(userId) },
          { sharedWith: new Types.ObjectId(userId) },
        ],
      })
      .populate('user', 'firstName lastName email')
      .exec();
  }

  async create(userId: string, name: string): Promise<Cart> {
    const count = await this.cartModel.countDocuments({
      user: new Types.ObjectId(userId),
    });
    if (count >= this.MAX_CARTS) {
      throw new BadRequestException(
        `Maximum of ${this.MAX_CARTS} carts allowed`,
      );
    }

    const existing = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
      name,
    });
    if (existing) {
      throw new ConflictException('Cart with this name already exists');
    }

    return this.cartModel.create({
      user: new Types.ObjectId(userId),
      name,
      items: [],
    });
  }

  async addItem(
    userId: string,
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    const product = await this.productModel.findById(productId);
    if (!product || !product.isAvailable)
      throw new NotFoundException('Product not available');

    const cart = await this.cartModel.findOne({
      _id: cartId,
      $or: [
        { user: new Types.ObjectId(userId) },
        { sharedWith: new Types.ObjectId(userId) },
      ],
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    const currentQuantity = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
    const totalRequested = currentQuantity + quantity;

    if (product.stock < totalRequested) {
      throw new BadRequestException(`Only ${product.stock} items in stock`);
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = totalRequested;
    } else {
      if (cart.items.length >= this.MAX_ITEMS_PER_CART) {
        throw new BadRequestException(
          `Cart reached maximum limit of ${this.MAX_ITEMS_PER_CART} items`,
        );
      }
      cart.items.push({
        product: new Types.ObjectId(productId) as any,
        quantity,
      });
    }

    return cart.save();
  }

  async updateItem(
    userId: string,
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    const product = await this.productModel.findById(productId);
    if (!product || !product.isAvailable)
      throw new NotFoundException('Product not available');

    if (quantity > product.stock) {
      throw new BadRequestException(`Only ${product.stock} items in stock`);
    }

    const cart = await this.cartModel.findOne({
      _id: cartId,
      $or: [
        { user: new Types.ObjectId(userId) },
        { sharedWith: new Types.ObjectId(userId) },
      ],
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (itemIndex === -1) throw new NotFoundException('Item not found in cart');

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    return cart.save();
  }

  async removeItem(
    userId: string,
    cartId: string,
    productId: string,
  ): Promise<Cart> {
    return this.updateItem(userId, cartId, productId, 0);
  }

  async moveItem(
    userId: string,
    fromCartId: string,
    toCartId: string,
    productId: string,
  ): Promise<{ fromCart: Cart; toCart: Cart }> {
    const fromCart = await this.cartModel.findOne({
      _id: fromCartId,
      user: new Types.ObjectId(userId),
    });
    const toCart = await this.cartModel.findOne({
      _id: toCartId,
      user: new Types.ObjectId(userId),
    });

    if (!fromCart || !toCart)
      throw new NotFoundException('One or both carts not found');

    const itemIndex = fromCart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (itemIndex === -1)
      throw new NotFoundException('Item not found in source cart');

    const [item] = fromCart.items.splice(itemIndex, 1);

    // Add to toCart
    const toItemIndex = toCart.items.findIndex(
      (i) => i.product.toString() === productId,
    );
    if (toItemIndex > -1) {
      toCart.items[toItemIndex].quantity += item.quantity;
    } else {
      if (toCart.items.length >= this.MAX_ITEMS_PER_CART) {
        throw new BadRequestException('Destination cart is full');
      }
      toCart.items.push(item);
    }

    await fromCart.save();
    await toCart.save();

    return { fromCart, toCart };
  }

  async rename(userId: string, cartId: string, newName: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({
      _id: cartId,
      user: new Types.ObjectId(userId),
    });
    if (!cart) throw new NotFoundException('Cart not found');
    if (cart.isDefault)
      throw new BadRequestException('Cannot rename default cart');

    cart.name = newName;
    return cart.save();
  }

  async deleteCart(userId: string, cartId: string): Promise<void> {
    const cart = await this.cartModel.findOne({
      _id: cartId,
      user: new Types.ObjectId(userId),
    });
    if (!cart) throw new NotFoundException('Cart not found');
    if (cart.isDefault)
      throw new BadRequestException('Cannot delete default cart');

    await this.cartModel.deleteOne({ _id: cartId });
  }

  async mergeLocalCart(
    userId: string,
    localCart: { name: string; items: { product: string; quantity: number }[] },
  ): Promise<Cart> {
    const existing = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
      name: localCart.name,
    });

    if (existing) {
      // Requirement says prompt user, but for backend we can provide a merge option
      // Here we'll just handle creating a new one with "Unknown" prefix if conflict arises
      // OR the frontend handles the choice and calls appropriate endpoint.
      // Let's implement a "create with unique name" logic as a fallback
      let newName = localCart.name;
      let i = 1;
      while (
        await this.cartModel.findOne({
          user: new Types.ObjectId(userId),
          name: newName,
        })
      ) {
        newName = `Unknown Cart ${i++}`;
      }
      return this.cartModel.create({
        user: new Types.ObjectId(userId),
        name: newName,
        items: localCart.items.map((item) => ({
          product: new Types.ObjectId(item.product),
          quantity: item.quantity,
        })),
      });
    }

    return this.cartModel.create({
      user: new Types.ObjectId(userId),
      name: localCart.name,
      items: localCart.items.map((item) => ({
        product: new Types.ObjectId(item.product),
        quantity: item.quantity,
      })),
    });
  }

  async validateCart(
    userId: string,
    cartId: string,
  ): Promise<{ issues: string[]; cart: Cart }> {
    const cart = await this.cartModel
      .findOne({ _id: cartId, user: new Types.ObjectId(userId) })
      .populate('items.product');

    if (!cart) throw new NotFoundException('Cart not found');

    const issues: string[] = [];
    let modified = false;

    const updatedItems = [];
    for (const item of cart.items) {
      const product = item.product as any; // populated

      if (!product || !product.isAvailable) {
        issues.push(
          `Product '${product?.name || 'Unknown'}' is discontinued and removed.`,
        );
        modified = true;
        continue; // Auto-remove from cart
      }

      if (product.stock < item.quantity) {
        issues.push(`'${product.name}' is out of stock or quantity reduced.`);
      }

      updatedItems.push(item);
    }

    if (modified) {
      cart.items = updatedItems;
      await cart.save();
    }

    return { issues, cart };
  }

  async shareCart(
    userId: string,
    cartId: string,
    targetEmail: string,
  ): Promise<Cart> {
    const cart = await this.cartModel.findOne({
      _id: cartId,
      user: new Types.ObjectId(userId),
    });
    if (!cart)
      throw new NotFoundException('Cart not found or you are not the owner');

    const targetUser = await this.userModel.findOne({ email: targetEmail });
    if (!targetUser) throw new NotFoundException('Target user not found');

    if (
      cart.sharedWith.some((id) => id.toString() === targetUser._id.toString())
    ) {
      throw new BadRequestException('Cart already shared with this user');
    }

    cart.sharedWith.push(targetUser._id);
    return cart.save();
  }

  async unshareCart(
    userId: string,
    cartId: string,
    targetUserId: string,
  ): Promise<Cart> {
    const cart = await this.cartModel.findOne({
      _id: cartId,
      user: new Types.ObjectId(userId),
    });
    if (!cart)
      throw new NotFoundException('Cart not found or you are not the owner');

    cart.sharedWith = cart.sharedWith.filter(
      (id) => id.toString() !== targetUserId,
    );
    return cart.save();
  }

  async removeProductFromAllCarts(productId: string): Promise<void> {
    await this.cartModel
      .updateMany(
        {},
        { $pull: { items: { product: new Types.ObjectId(productId) } } },
      )
      .exec();
  }
}
