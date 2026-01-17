import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ProductsService } from '../../products/products.service';
import { CategoriesService } from '../../categories/categories.service';
import { UserRole } from '../../users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/user.schema';
import { Model } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productsService = app.get(ProductsService);
  const categoriesService = app.get(CategoriesService);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  console.log('🌱 Seeding database...');

  // 1. Create Admin if not exists
  const adminEmail = 'admin@alzafar.com';
  const adminUser = await userModel.findOne({ email: adminEmail });
  if (!adminUser) {
    await userModel.create({
      email: adminEmail,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      firebaseUid: 'SEED_ADMIN_UID', // This should be replaced with real Firebase UID
    });
    console.log('✅ Admin user created');
  }

  // 2. Create Categories
  const categories = [
    { name: 'Apparel', description: 'Clothing and fashion' },
    { name: 'Electronics', description: 'Gadgets and hardware' },
    { name: 'Home & Kitchen', description: 'Essentials for your home' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const existing = await categoriesService.findAll();
    let found = existing.find((c) => c.name === cat.name);
    if (!found) {
      found = await categoriesService.create(cat);
      console.log(`✅ Category '${cat.name}' created`);
    }
    createdCategories.push(found);
  }

  // 3. Create Products
  const products = [
    {
      name: 'Classic White Tee',
      description: '100% Cotton premium white t-shirt',
      price: 25,
      stock: 100,
      category: createdCategories[0]._id.toString(),
      images: [
        {
          large: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
          medium:
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
          thumbnail:
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
        },
      ],
    },
    {
      name: 'Ultra Wireless Buds',
      description: 'Noise cancelling spatial audio earbuds',
      price: 150,
      stock: 50,
      category: createdCategories[1]._id.toString(),
      images: [
        {
          large: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
          medium:
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
          thumbnail:
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
        },
      ],
    },
  ];

  for (const prod of products) {
    const existing = await productsService.search({ q: prod.name });
    if (existing.total === 0) {
      await productsService.create(prod);
      console.log(`✅ Product '${prod.name}' created`);
    }
  }

  console.log('✨ Seeding complete!');
  await app.close();
}

bootstrap();
