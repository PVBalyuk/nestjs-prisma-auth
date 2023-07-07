import { ConflictException, Injectable } from '@nestjs/common';
import { Role, User, UserRole } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { hash } from 'bcrypt';

export interface ILoginDto extends User {
  user_roles: UserRole[] | [];
}

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

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

    return user;
  }

  async delete(id: string) {
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

  async updateUserRole(userId: string, roleValue: Role) {
    const currentUserRoles = await this.prismaService.userRole
      .findMany({
        where: {
          userId,
        },
      })
      .then((res) => res.map((userRole) => userRole.role));

    console.log(currentUserRoles);

    if (currentUserRoles.includes(roleValue)) {
      throw new ConflictException(
        `User with id ${userId} already has ${roleValue} rights`,
      );
    }

    return this.prismaService.userRole.create({
      data: {
        userId,
        role: roleValue,
      },
    });
  }
}
