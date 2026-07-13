import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { B2BSearchService } from '../services/b2b-search.service';
import { TenantId } from '../../../shared/decorators/auth.decorators';

@Controller('b2b')
export class B2BSearchController {
  constructor(private b2bSearchService: B2BSearchService) {}

  @Post('search')
  async searchMarketplace(
    @TenantId() resellerTenantId: string,
    @Body()
    query: {
      hotelName?: string;
      city?: string;
      countryCode?: string;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children?: number;
    },
  ) {
    return this.b2bSearchService.searchMarketplace(resellerTenantId, {
      hotelName: query.hotelName,
      city: query.city,
      countryCode: query.countryCode,
      checkInDate: new Date(query.checkInDate),
      checkOutDate: new Date(query.checkOutDate),
      adults: query.adults,
      children: query.children,
    });
  }

  @Get('hotels/:propertyId')
  async getMarketplaceProperty(@Param('propertyId') propertyId: string) {
    return this.b2bSearchService.getMarketplaceProperty(propertyId);
  }
}
