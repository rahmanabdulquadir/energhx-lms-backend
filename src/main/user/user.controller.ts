import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { Request } from 'express';
import { CreateAnUserDto } from './user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get me
  @Get('me')
  @UseGuards(AuthGuard)
  async getUser(@Req() req: Request) {
    return this.userService.getMe(req.user);
  }

  // Create user (Server/ Developer)
  @Post('register')
  async registerUser(@Body() createAnUserDto: CreateAnUserDto) {
    return this.userService.registerUser(createAnUserDto);
  }
}
