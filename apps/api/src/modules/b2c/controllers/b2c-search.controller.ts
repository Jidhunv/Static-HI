import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { B2CSearchService } from '../services/b2c-search.service';
import { ApiKeyGuard } from '../../api-key/api-key.guard';

@Controller('b2c')
@UseGuards(ApiKeyGuard)
export class B2CSearchController {
  constructor(private b2cSearchService: B2CSearchService) {}

  @Post('search')
  async searchTenantInventory(
    @Body()
    query: {
      tenantSlug: string;
      hotelName?: string;
      city?: string;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children?: number;
    },
  ) {
    return this.b2cSearchService.searchTenantInventory(query.tenantSlug, {
      hotelName: query.hotelName,
      city: query.city,
      checkInDate: new Date(query.checkInDate),
      checkOutDate: new Date(query.checkOutDate),
      adults: query.adults,
      children: query.children,
    });
  }

  @Get('hotels/:propertyId')
  async getPublicPropertyDetails(
    @Param('propertyId') propertyId: string,
    @Query('tenantSlug') tenantSlug: string,
  ) {
    return this.b2cSearchService.getPublicPropertyDetails(tenantSlug, propertyId);
  }

  @Get('hotels/:propertyId/rooms/:roomCode')
  async getRoomAvailability(
    @Param('propertyId') propertyId: string,
    @Param('roomCode') roomCode: string,
    @Query('tenantSlug') tenantSlug: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
  ) {
    return this.b2cSearchService.getRoomAvailability(
      tenantSlug,
      propertyId,
      roomCode,
      new Date(checkInDate),
      new Date(checkOutDate),
    );
  }
}
