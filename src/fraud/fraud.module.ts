import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FraudService } from './fraud.service';
import { FraudLog, FraudLogSchema } from './schemas/fraud-log.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FraudLog.name, schema: FraudLogSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
