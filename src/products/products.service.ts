import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CartsService } from '../carts/carts.service';
import { WishlistsService } from '../wishlists/wishlists.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SearchProductsDto, ProductSort } from './dto/search-products.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<Product>,
        private cartsService: CartsService,
        private wishlistsService: WishlistsService,
    ) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        const createdProduct = new this.productModel(createProductDto);
        return createdProduct.save();
    }

    async findAll(paginationDto: PaginationDto): Promise<{ products: Product[]; total: number }> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            this.productModel
                .find()
                .populate('category')
                .skip(skip)
                .limit(limit)
                .exec(),
            this.productModel.countDocuments().exec(),
        ]);

        return { products, total };
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productModel.findById(id).populate('category').exec();
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async findByCategory(
        categoryId: string,
        paginationDto: PaginationDto
    ): Promise<{ products: Product[]; total: number }> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            this.productModel
                .find({ category: categoryId })
                .populate('category')
                .skip(skip)
                .limit(limit)
                .exec(),
            this.productModel.countDocuments({ category: categoryId }).exec(),
        ]);

        return { products, total };
    }

    async search(searchDto: SearchProductsDto): Promise<{ products: Product[]; total: number }> {
        const { q, category, minPrice, maxPrice, sort, page = 1, limit = 10 } = searchDto;
        const skip = (page - 1) * limit;

        const query: any = { isAvailable: true };

        // 1. Full-Text Search with Relevance
        if (q) {
            query.$text = { $search: q };
        }

        // 2. Filters
        if (category) query.category = new Types.ObjectId(category);
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = minPrice;
            if (maxPrice !== undefined) query.price.$lte = maxPrice;
        }

        // 3. Sorting Strategy
        let sortOption: any = {};
        if (sort === ProductSort.PRICE_ASC) sortOption = { price: 1 };
        else if (sort === ProductSort.PRICE_DESC) sortOption = { price: -1 };
        else if (sort === ProductSort.NEWEST) sortOption = { createdAt: -1 };
        else if (q) sortOption = { score: { $meta: 'textScore' } }; // Default to relevance if searching
        else sortOption = { createdAt: -1 };

        // 4. Execution
        const findQuery = this.productModel.find(query);

        // Include text score in project if searching
        if (q) {
            findQuery.select({ score: { $meta: 'textScore' } });
        }

        const [products, total] = await Promise.all([
            findQuery
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate('category')
                .exec(),
            this.productModel.countDocuments(query).exec(),
        ]);

        return { products, total };
    }

    async update(id: string, updateProductDto: Partial<CreateProductDto>): Promise<Product> {
        const oldProduct = await this.productModel.findById(id);
        if (!oldProduct) throw new NotFoundException('Product not found');

        const updatedProduct = await this.productModel
            .findByIdAndUpdate(id, updateProductDto, { new: true })
            .exec();

        if (!updatedProduct) throw new NotFoundException('Product update failed');

        // Detect Price Drop
        if (updateProductDto.price && updateProductDto.price < oldProduct.price) {
            await this.wishlistsService.notifyPriceDrop(id, updatedProduct.name, updatedProduct.price);
        }

        // If product is marked as unavailable, remove from all carts/wishlists
        if (updatedProduct.isAvailable === false) {
            await this.cartsService.removeProductFromAllCarts(id);
            await this.wishlistsService.removeProductFromAllWishlists(id);
        }

        return updatedProduct as Product;
    }

    async remove(id: string): Promise<any> {
        const result = await this.productModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Cleanup
        await this.cartsService.removeProductFromAllCarts(id);
        await this.wishlistsService.removeProductFromAllWishlists(id);

        return result;
    }
}
