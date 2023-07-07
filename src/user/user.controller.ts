import {
  Body,
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
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() dto: any) {
    return await this.userService.save(dto);
  }

  @Get(':idOrEmail')
  async findOneUser(@Param('idOrEmail', ParseUUIDPipe) idOrEmail: string) {
    const user = await this.userService.findOne(idOrEmail);

    if (!user) {
      throw new HttpException(
        'no user with such id or email',
        HttpStatus.BAD_REQUEST,
      );
    }

    return user;
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.delete(id);
  }

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<User>,
  ) {
    return this.userService.updateUser(id, updateDto);
  }
}
