import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Role, User } from '@prisma/client';
import { UserResponse } from './responses';
import { CurrentUser } from '@common/decorators';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post()
  async createUser(@Body() dto: any) {
    const user = await this.userService.save(dto);

    return new UserResponse(user);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':idOrEmail')
  async findOneUser(@Param('idOrEmail', ParseUUIDPipe) idOrEmail: string) {
    const user = await this.userService.findOne(idOrEmail);

    if (!user) {
      throw new HttpException(
        'no user with such id or email',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new UserResponse(user);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('roles') roles: Role[],
  ) {
    return this.userService.delete(id, roles);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async getAllUsers() {
    const users = await this.userService.getAllUsers();

    return users.map((user) => new UserResponse(user));
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<User>,
  ) {
    const user = await this.userService.updateUser(id, updateDto);

    return new UserResponse(user);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('role/create/:userId')
  async addUserRole(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userService.addAdminRole(userId);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('role/remove/:userId')
  async updateUserRole(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userService.removeAdminRole(userId);
  }
}
