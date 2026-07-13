import { Controller, Get, Param, Query } from '@nestjs/common';
import { AmenityService } from '../services/amenity.service';

@Controller('masters/amenities')
export class AmenityController {
  constructor(private amenityService: AmenityService) {}

  @Get()
  async getAllAmenities(@Query('category') category?: string) {
    if (category) {
      return this.amenityService.getAmenitiesByCategory(category);
    }
    return this.amenityService.getAllAmenities();
  }

  @Get(':id')
  async getAmenity(@Param('id') id: string) {
    return this.amenityService.getAmenityById(id);
  }
}
