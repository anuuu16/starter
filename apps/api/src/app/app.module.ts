import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AiUsageModule } from './ai-usage/ai-usage.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { CommonModule } from './common/common.module';
import { RequestLoggerMiddleware } from './common/middleware/logger.middleware';
import { AppConfigModule } from './config/config.module';
import { CronModule } from './cron/cron.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { InvitationsModule } from './invitations/invitations.module';
import { AppLoggerModule } from './logger/logger.module';
import { LookupModule } from './lookup/lookup.module';
import { MailModule } from './mail/mail.module';
import { NotificationModule } from './notification/notification.module';
import { OrgModule } from './org/org.module';
import { PaymentModule } from './payment/payment.module';
import { ReferralsModule } from './referrals/referrals.module';
import { RenderModule } from './render/render.module';
import { SettingsModule } from './settings/settings.module';
import { StorageModule } from './storage/storage.module';
import { TotpModule } from './totp/totp.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    // Server-side i18n. Locale files live in src/assets/i18n/<lng>/*.json and are
    // copied to dist/apps/api/assets/i18n by the webpack `assets` glob, so
    // __dirname (the bundle dir) + /assets/i18n resolves in dev and prod alike.
    // Language is resolved from ?lang=, the `x-lang` header, or Accept-Language.
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '/assets/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    MailModule.forRootAsync(),
    CommonModule,
    AuthModule,
    UsersModule,
    HealthModule,
    PaymentModule,
    AdminModule,
    LookupModule,
    AiModule,
    AiUsageModule,
    SettingsModule,
    RenderModule,
    StorageModule,
    NotificationModule,
    VerificationModule,
    // Tier 1 boilerplate modules (docs/16)
    CacheModule,
    AuditModule,
    OrgModule,
    InvitationsModule,
    CronModule,
    ApiKeysModule,
    TotpModule,
    WebhooksModule.forRootAsync(),
    IdempotencyModule,
    ReferralsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
