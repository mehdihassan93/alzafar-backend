import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    stock: number;

    @Prop({
        type: [{
            large: { type: String, required: true },
            medium: { type: String, required: true },
            thumbnail: { type: String, required: true },
        }],
        default: []
    })
    images: { large: string; medium: string; thumbnail: string }[];

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    category: Types.ObjectId;

    @Prop({ default: true })
    isAvailable: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Optimal Search Indexing:
// High weight on Name, medium on Description.
ProductSchema.index(
    { name: 'text', description: 'text' },
    { weights: { name: 10, description: 5 }, name: 'ProductSearchIndex' }
);
