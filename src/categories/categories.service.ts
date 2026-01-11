import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<Category>,
    ) { }

    async create(createCategoryDto: any): Promise<Category> {
        const existing = await this.categoryModel.findOne({ name: createCategoryDto.name });
        if (existing) {
            throw new ConflictException('Category already exists');
        }
        const createdCategory = new this.categoryModel(createCategoryDto);
        return createdCategory.save();
    }

    async findAll(): Promise<Category[]> {
        return this.categoryModel.find().exec();
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoryModel.findById(id).exec();
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async update(id: string, updateCategoryDto: any): Promise<Category> {
        const updatedCategory = await this.categoryModel
            .findByIdAndUpdate(id, updateCategoryDto, { new: true })
            .exec();
        if (!updatedCategory) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return updatedCategory;
    }

    async remove(id: string): Promise<Category> {
        const deletedCategory = await this.categoryModel.findByIdAndDelete(id).exec();
        if (!deletedCategory) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return deletedCategory;
    }
}
