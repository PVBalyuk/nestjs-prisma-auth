import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { UserService } from '@user/user.service';
import { Tokens } from './interfaces';
import { compareSync } from 'bcrypt';
import { Token, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma/prisma.service';
import { v4 } from 'uuid';
import { add } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user: User = await this.userService.findOne(registerDto.email);

    if (user) {
      throw new ConflictException('User with this email already registered');
    }
    return this.userService.save(registerDto);
  }

  async login(loginDto: LoginDto): Promise<Tokens> {
    const user: User = await this.userService.findOne(loginDto.email);

    if (!user || !compareSync(loginDto.password, user.password)) {
      throw new UnauthorizedException('Incorrect login or password');
    }

    const accessToken = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });

    const refreshToken = await this.getRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  private async getRefreshToken(userId: string): Promise<Token> {
    return this.prismaService.token.create({
      data: {
        token: v4(),
        exp: add(new Date(), { months: 1 }),
        userId,
      },
    });
  }
}
