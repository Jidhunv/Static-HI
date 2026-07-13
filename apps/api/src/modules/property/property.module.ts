import { Module } from '@nestjs/common';
import { PropertyController } from './controllers/property.controller';
import { PropertyService } from './services/property.service';
import { RoomService } from './services/room.service';
import { RatePlanService } from './services/rate-plan.service';

@Module({
  controllers: [PropertyController],
  providers: [PropertyService, RoomService, RatePlanService],
})
export class PropertyModule {}
