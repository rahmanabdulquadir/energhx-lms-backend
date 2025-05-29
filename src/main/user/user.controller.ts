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
  UsePipes,
  ValidationPipe,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { Request, Response } from 'express';
import { CreatePasswordDto, CreateUserDto } from './user.dto';
import sendResponse from 'src/utils/sendResponse';
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { LibService } from 'src/lib/lib.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly lib: LibService,
  ) {}

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

  @Get('/')
  // @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  async getAllUsers(@Res() res: Response) {
    const result = await this.userService.getAllUsers();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'All Users fetched Successfully',
      data: result,
    });
  }

  // Create user (Server/ Developer)
  @Post('register')
  @UploadInterceptor('file')
  async registerUser(
    @Body('text') text: string, // this is the JSON string from "text"
    @UploadedFile() file: any,
    @Res() res: Response,
  ) {
    let createUserDto: any;
    // Parse text and transform to DTO instance
    const parsed = JSON.parse(text);
    createUserDto = plainToInstance(CreateUserDto, parsed);

    // Validate the parsed DTO manually
    const errors = await validate(createUserDto);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
        })),
      });
    }

    // If file is uploaded, attach URL
    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        createUserDto.profile_photo = uploaded.secure_url;
      }
    }

    const result = await this.userService.registerUser(createUserDto);
    return res.status(201).json({
      success: true,
      message: 'Please check your email to verify your account',
      data: result,
    });
  }

  @Post('create-password')
  async CreatePassword(
    @Query('token') token: string,
    @Res() res: Response,
    @Body() body: CreatePasswordDto,
  ) {
    const result = await this.userService.createPassword(body, token);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  }
}
