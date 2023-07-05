import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@user/user.module';
import { getJwtOptions } from './config';
import { STRATEGIES } from './strategies';
import { GUARDS } from './guards';

@Module({
  providers: [AuthService, ...STRATEGIES, ...GUARDS],
  controllers: [AuthController],
  imports: [
    PassportModule,
    JwtModule.registerAsync(getJwtOptions()),
    UserModule,
  ],
})
export class AuthModule {}
