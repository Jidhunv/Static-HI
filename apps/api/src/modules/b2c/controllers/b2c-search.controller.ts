import { Controller, Post, Get, Param, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { B2CSearchService } from '../services/b2c-search.service';
import { ApiKeyGuard, ApiKeyInfo } from '../../api-key/api-key.guard';
import { Public } from '../../../shared/security/access.decorators';

// No user login: authenticated by the storefront's API key instead.
@Public()
@Controller('b2c')
@UseGuards(ApiKeyGuard)
export class B2CSearchController {
  constructor(private b2cSearchService: B2CSearchService) {}

  /** A key only works for the storefront of the tenant it was issued to. */
  private ownSlug(key: { tenant?: { slug?: string } }, tenantSlug: string) {
    if (!key?.tenant?.slug || key.tenant.slug !== tenantSlug) {
      throw new ForbiddenException('This API key does not belong to that storefront');
    }
    return tenantSlug;
  }

  @Post('search')
  async searchTenantInventory(
    @ApiKeyInfo() key: any,
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
    return this.b2cSearchService.searchTenantInventory(this.ownSlug(key, query.tenantSlug), {
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
    @ApiKeyInfo() key: any,
    @Param('propertyId') propertyId: string,
    @Query('tenantSlug') tenantSlug: string,
  ) {
    return this.b2cSearchService.getPublicPropertyDetails(this.ownSlug(key, tenantSlug), propertyId);
  }

  @Get('hotels/:propertyId/rooms/:roomCode')
  async getRoomAvailability(
    @ApiKeyInfo() key: any,
    @Param('propertyId') propertyId: string,
    @Param('roomCode') roomCode: string,
    @Query('tenantSlug') tenantSlug: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
  ) {
    return this.b2cSearchService.getRoomAvailability(
      this.ownSlug(key, tenantSlug),
      propertyId,
      roomCode,
      new Date(checkInDate),
      new Date(checkOutDate),
    );
  }
}
