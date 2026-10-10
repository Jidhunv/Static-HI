import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PropertyService } from '../services/property.service';
import { RoomService } from '../services/room.service';
import { RatePlanService } from '../services/rate-plan.service';
import { TenantId } from '../../../shared/decorators/auth.decorators';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';

@Controller('properties')
export class PropertyController {
  constructor(
    private propertyService: PropertyService,
    private roomService: RoomService,
    private ratePlanService: RatePlanService,
  ) {}

  // =========== PROPERTIES ===========

  @Post()
  async createProperty(
    @TenantId() tenantId: string,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertyService.createProperty(tenantId, dto);
  }

  @Get()
  async getProperties(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
  ) {
    return this.propertyService.getProperties(tenantId, { status, visibility });
  }

  @Get('search/global-hotels')
  async searchGlobalHotels(
    @Query('name') name: string,
    @Query('countryId') countryId: string,
  ) {
    return this.propertyService.searchGlobalHotels(name, countryId);
  }

  @Get(':id')
  async getProperty(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.propertyService.getProperty(tenantId, id);
  }

  @Put(':id')
  async updateProperty(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertyService.updateProperty(tenantId, id, dto);
  }

  @Delete(':id')
  async deleteProperty(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.propertyService.deleteProperty(tenantId, id);
  }

  // =========== ROOMS ===========

  @Get(':propertyId/rooms')
  async getRoomsForProperty(
    @TenantId() tenantId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.roomService.getRoomsForProperty(tenantId, propertyId);
  }

  @Get(':propertyId/rooms/:roomId')
  async getRoomById(
    @TenantId() tenantId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.roomService.getRoomById(tenantId, roomId);
  }

  @Post(':propertyId/rooms')
  async createRoom(
    @TenantId() tenantId: string,
    @Param('propertyId') propertyId: string,
    @Body() dto: any,
  ) {
    return this.roomService.createRoom(tenantId, propertyId, dto);
  }

  @Delete(':propertyId/rooms/:roomId')
  async deleteRoom(
    @TenantId() tenantId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.roomService.deleteRoom(tenantId, propertyId, roomId);
  }

  // =========== RATE PLANS ===========

  @Get(':propertyId/rate-plans')
  async getRatePlansForProperty(
    @TenantId() tenantId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.ratePlanService.getRatePlansForProperty(tenantId, propertyId);
  }

  @Get(':propertyId/rate-plans/:ratePlanId')
  async getRatePlanById(
    @TenantId() tenantId: string,
    @Param('ratePlanId') ratePlanId: string,
  ) {
    return this.ratePlanService.getRatePlanById(tenantId, ratePlanId);
  }

  @Post(':propertyId/rate-plans')
  async createRatePlan(
    @TenantId() tenantId: string,
    @Param('propertyId') propertyId: string,
    @Body() dto: any,
  ) {
    return this.ratePlanService.createRatePlan(tenantId, propertyId, dto);
  }
}
