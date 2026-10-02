import { Module } from '@nestjs/common';
import { B2CSearchController } from './controllers/b2c-search.controller';
import { B2CBookingController } from './controllers/b2c-booking.controller';
import { MultiSupplierController } from './controllers/multi-supplier.controller';
import { SettlementController } from './controllers/settlement.controller';
import { B2CSearchService } from './services/b2c-search.service';
import { B2CBookingService } from './services/b2c-booking.service';
import { InventoryPublishingService } from './services/inventory-publishing.service';
import { InventoryFilteringService } from './services/inventory-filtering.service';
import { CommissionService } from './services/commission.service';
import { SupplierBillingService } from './services/supplier-billing.service';
import { SupplierPartnershipService } from './services/supplier-partnership.service';
import { PaymentVerifierService } from './services/payment-verifier.service';
import { SettlementService } from './services/settlement.service';
import { ApiKeyModule } from '../api-key/api-key.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ApiKeyModule, AuditModule],
  controllers: [B2CSearchController, B2CBookingController, MultiSupplierController, SettlementController],
  providers: [
    B2CSearchService,
    B2CBookingService,
    InventoryPublishingService,
    InventoryFilteringService,
    CommissionService,
    SupplierBillingService,
    SupplierPartnershipService,
    SettlementService,
    PaymentVerifierService,
  ],
})
export class B2CModule {}
