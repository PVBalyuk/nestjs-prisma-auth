import { Inject, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Module({
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
  imports: [CacheModule.register()],
})
export class UserModule {}
