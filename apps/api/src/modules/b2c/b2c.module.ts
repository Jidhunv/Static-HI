import { Module } from '@nestjs/common';
import { B2CSearchController } from './controllers/b2c-search.controller';
import { B2CBookingController } from './controllers/b2c-booking.controller';
import { B2CSearchService } from './services/b2c-search.service';
import { B2CBookingService } from './services/b2c-booking.service';

@Module({
  controllers: [B2CSearchController, B2CBookingController],
  providers: [B2CSearchService, B2CBookingService],
})
export class B2CModule {}
