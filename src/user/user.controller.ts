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
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Role, User } from '@prisma/client';
import { UserResponse } from './responses';

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
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.delete(id);
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
  @Patch('role/:userId')
  async updateUserRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() userRole: { userRole: Role },
  ) {
    console.log(userRole);
    return this.userService.updateUserRole(userId, userRole.userRole);
  }
}
