import { Module } from '@nestjs/common';
import { EntityApprovalService } from './entity-approval.service';
import { EntityApprovalController } from './entity-approval.controller';

@Module({
  providers: [EntityApprovalService],
  controllers: [EntityApprovalController],
  exports: [EntityApprovalService],
})
export class ApprovalModule {}
