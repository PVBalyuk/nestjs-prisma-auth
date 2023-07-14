import { convertToSeconds } from '@common/utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, User, UserRole } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { hash } from 'bcrypt';
import { Cache } from 'cache-manager';

export interface ILoginDto extends User {
  user_roles: UserRole[] | [];
}

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  async save(user: Partial<User>) {
    const hashPassword = await this.hashPassword(user.password);
    const newUser = await this.prismaService.user.create({
      data: {
        email: user.email,
        password: hashPassword,
        user_roles: {
          create: {
            role: 'USER',
          },
        },
      },
    });

    return newUser;
  }

  async findOne(idOrEmail: string): Promise<ILoginDto> {
    const userFromCacheManager = await this.cacheManager.get<ILoginDto>(
      idOrEmail,
    );

    if (!userFromCacheManager) {
      const user = await this.prismaService.user.findFirst({
        where: {
          OR: [
            {
              id: idOrEmail,
            },
            {
              email: idOrEmail,
            },
          ],
        },
        include: {
          user_roles: true,
        },
      });

      if (!user) return null;

      await this.cacheManager.set(
        idOrEmail,
        user,
        convertToSeconds(this.configService.get('JWT_EXP')),
      );

      return user;
    }

    return userFromCacheManager;
  }

  async delete(id: string, roles: Role[]) {
    const isCurrentUserHasAdminRights = roles.some(
      (role) => role === Role.ADMIN,
    );

    console.log(roles);

    console.log(isCurrentUserHasAdminRights);
    if (!isCurrentUserHasAdminRights) {
      throw new ForbiddenException();
    }

    return this.prismaService.user.delete({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.prismaService.user.findMany({
      include: {
        user_roles: {
          select: {
            role: true,
          },
        },
      },
    });
  }

  async updateUser(id: string, updateUserData: Partial<User>) {
    return this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        ...updateUserData,
      },
    });
  }

  async addAdminRole(userId: string) {
    const currentUserRoles = await this.prismaService.userRole
      .findMany({
        where: {
          userId,
        },
      })
      .then((res) => res.map((userRole) => userRole.role));

    if (currentUserRoles.includes(Role.ADMIN)) {
      throw new ConflictException(
        `User with id ${userId} already has ${Role.ADMIN} rights`,
      );
    }

    return this.prismaService.userRole.create({
      data: {
        userId,
        role: Role.ADMIN,
      },
    });
  }

  async removeAdminRole(userId: string) {
    const currentUserRoles = await this.prismaService.userRole
      .findMany({
        where: {
          userId,
        },
      })
      .then((res) => res.map((userRole) => userRole.role));

    if (!currentUserRoles.includes(Role.ADMIN)) {
      throw new ConflictException(
        `User with id ${userId} doesn't has ${Role.ADMIN} rights`,
      );
    }

    return this.prismaService.userRole.deleteMany({
      where: {
        AND: {
          userId,
          role: Role.ADMIN,
        },
      },
    });
  }
}
