import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { ILoginDto, UserService } from '@user/user.service';
import { Tokens } from './interfaces';
import { compareSync } from 'bcrypt';
import { Token, User, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma/prisma.service';
import { v4 } from 'uuid';
import { add } from 'date-fns';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user: User = await this.userService.findOne(registerDto.email);

    if (user) {
      throw new ConflictException('User with this email already registered');
    }
    return this.userService.save(registerDto);
  }

  async login(loginDto: LoginDto, agent: string): Promise<Tokens> {
    const user = await this.userService.findOne(loginDto.email);

    if (!user || !compareSync(loginDto.password, user.password)) {
      throw new UnauthorizedException('Incorrect login or password');
    }

    return this.generateTokens(user, agent);
  }

  async refreshTokens(refreshToken: string, agent: string) {
    const token = await this.prismaService.token.delete({
      where: {
        token: refreshToken,
      },
    });

    if (!token) {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findOne(token.userId);

    return this.generateTokens(user, agent);
  }

  private async generateTokens(
    user: ILoginDto,
    agent: string,
  ): Promise<Tokens> {
    const accessToken = await this.jwtService.signAsync(
      {
        id: user.id,
        email: user.email,
        roles: user.user_roles.map((roleData: UserRole) => roleData.role),
      },
      { expiresIn: this.configService.get('JWT_EXP') },
    );

    const refreshToken = await this.getRefreshToken(user.id, agent);

    return { accessToken, refreshToken };
  }

  private async getRefreshToken(userId: string, agent: string): Promise<Token> {
    const token = await this.prismaService.token.findFirst({
      where: {
        userId,
        userAgent: agent,
      },
    });

    return this.prismaService.token.upsert({
      where: { token: token?.token || '' },
      update: { token: v4(), exp: add(new Date(), { months: 1 }) },
      create: {
        token: v4(),
        exp: add(new Date(), { months: 1 }),
        userId,
        userAgent: agent,
      },
    });
  }

  async deleteRefreshToken(token: string) {
    return this.prismaService.token.delete({
      where: {
        token,
      },
    });
  }
}
