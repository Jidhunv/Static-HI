import { Public } from '../../../shared/security/access.decorators';
import { Controller, Get, Param } from '@nestjs/common';
import { CountryService } from '../services/country.service';

// Reference data, needed before sign-in.
@Public()
@Controller('masters/countries')
export class CountryController {
  constructor(private countryService: CountryService) {}

  @Get()
  async getAllCountries() {
    return this.countryService.getAllCountries();
  }

  @Get(':id')
  async getCountry(@Param('id') id: string) {
    return this.countryService.getCountryById(id);
  }

  @Get('code/:code')
  async getCountryByCode(@Param('code') code: string) {
    return this.countryService.getCountryByCode(code);
  }
}
