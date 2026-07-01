import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  /**
   * Demonstrates server-side i18n. Try `/api/i18n-demo?lang=hi` or send an
   * `x-lang: hi` / `Accept-Language: hi` header to get the Hindi variant.
   */
  @Public()
  @Get('i18n-demo')
  i18nDemo(@I18n() i18n: I18nContext) {
    return {
      lang: i18n.lang,
      hello: i18n.t('common.hello'),
      welcome: i18n.t('common.welcome', { args: { name: 'Anubhav' } }),
    };
  }
}
