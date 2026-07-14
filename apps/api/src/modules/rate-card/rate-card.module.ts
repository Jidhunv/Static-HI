import { Module } from '@nestjs/common';
import { RateCardService } from './rate-card.service';
import { RateCardController } from './rate-card.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  providers: [RateCardService],
  controllers: [RateCardController],
  exports: [RateCardService],
})
export class RateCardModule {}
