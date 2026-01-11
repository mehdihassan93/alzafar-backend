import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Query } from '@nestjs/common';
import { SearchProductsDto } from './dto/search-products.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get('search')
    @ApiOperation({ summary: 'Search and filter products (Best optimal algorithm)' })
    async search(@Query() searchDto: SearchProductsDto) {
        return this.productsService.search(searchDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all active products with pagination' })
    async findAll(@Query() paginationDto: PaginationDto) {
        return this.productsService.findAll(paginationDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product details by ID' })
    async findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Get('category/:categoryId')
    @ApiOperation({ summary: 'Get products by category with pagination' })
    async findByCategory(
        @Param('categoryId') categoryId: string,
        @Query() paginationDto: PaginationDto
    ) {
        return this.productsService.findByCategory(categoryId, paginationDto);
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new product (Admin only)' })
    async create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Put(':id')
    @ApiBearerAuth()
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update a product (Admin only)' })
    async update(@Param('id') id: string, @Body() updateProductDto: Partial<CreateProductDto>) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a product (Admin only)' })
    async remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
