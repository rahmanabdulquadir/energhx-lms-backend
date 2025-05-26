import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { Request, Response } from 'express';
import { CreateUserDto } from './user.dto';
import sendResponse from 'src/utils/sendResponse';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get me
  @Get('me')
  @UseGuards(AuthGuard)
  async getUser(@Req() req: Request, @Res() res: Response) {
    const result = await this.userService.getMe(req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User profile fetched Successfully',
      data: result,
    });
  }

  // Create user (Server/ Developer)
  @Post('register')
  async registerUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createAnUserDto: CreateUserDto,
  ) {
    const result = await this.userService.registerUser(createAnUserDto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Verification email sent successfully',
      data: result,
    });
  }

  // Verify mail
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const result = await this.userService.verifyEmail(token);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  }
}
