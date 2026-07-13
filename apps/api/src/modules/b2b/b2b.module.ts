import { Module } from '@nestjs/common';
import { B2BSearchController } from './controllers/b2b-search.controller';
import { B2BDistributionController } from './controllers/b2b-distribution.controller';
import { B2BBookingController } from './controllers/b2b-booking.controller';
import { B2BSearchService } from './services/b2b-search.service';
import { B2BDistributionService } from './services/b2b-distribution.service';
import { B2BBookingService } from './services/b2b-booking.service';

@Module({
  controllers: [
    B2BSearchController,
    B2BDistributionController,
    B2BBookingController,
  ],
  providers: [B2BSearchService, B2BDistributionService, B2BBookingService],
})
export class B2BModule {}
