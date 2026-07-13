import { Module } from '@nestjs/common';
import { CountryController } from './controllers/country.controller';
import { AmenityController } from './controllers/amenity.controller';
import { CountryService } from './services/country.service';
import { AmenityService } from './services/amenity.service';

@Module({
  controllers: [CountryController, AmenityController],
  providers: [CountryService, AmenityService],
})
export class MastersModule {}
