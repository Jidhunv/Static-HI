import { Module } from '@nestjs/common';
import { B2CSearchController } from './controllers/b2c-search.controller';
import { B2CBookingController } from './controllers/b2c-booking.controller';
import { MultiSupplierController } from './controllers/multi-supplier.controller';
import { B2CSearchService } from './services/b2c-search.service';
import { B2CBookingService } from './services/b2c-booking.service';
import { InventoryPublishingService } from './services/inventory-publishing.service';
import { InventoryFilteringService } from './services/inventory-filtering.service';
import { CommissionService } from './services/commission.service';
import { SupplierBillingService } from './services/supplier-billing.service';
import { SupplierPartnershipService } from './services/supplier-partnership.service';
import { ApiKeyModule } from '../api-key/api-key.module';

@Module({
  imports: [ApiKeyModule],
  controllers: [B2CSearchController, B2CBookingController, MultiSupplierController],
  providers: [
    B2CSearchService,
    B2CBookingService,
    InventoryPublishingService,
    InventoryFilteringService,
    CommissionService,
    SupplierBillingService,
    SupplierPartnershipService,
  ],
})
export class B2CModule {}
