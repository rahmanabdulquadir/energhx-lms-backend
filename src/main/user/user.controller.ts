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
  Param,
  Patch,
  HttpException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { Request, Response } from 'express';
import { CreatePasswordDto, CreateUserDto, UpdateUserDto } from './user.dto';
import sendResponse from 'src/utils/sendResponse';
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { LibService } from 'src/lib/lib.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { UserRole } from '@prisma/client';
import { IdDto } from 'src/common/id.dto';

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
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
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
    // Parse text and transform to DTO instance
    const parsed = JSON.parse(text);
    const createUserDto = plainToInstance(CreateUserDto, parsed);

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

    // Validate the parsed DTO manually
    const errors = await validate(createUserDto);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          Object.values(errors[0].constraints || {})[0] || 'Validation failed',
        errorDetails: errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
        })),
      });
    }
    const result = await this.userService.registerUser(createUserDto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Please check your email to verify your account!',
      data: result,
    });
  }

  // Update Me
  @Patch('update/me')
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async updateMe(
    @Req() req: Request,
    @Res() res: Response,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    let rawData: any = {};

    if (!text && !file) {
      throw new HttpException(
        'No data provided for update',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (text) rawData = JSON.parse(text);
    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        rawData.profile_photo = uploaded.secure_url;
      }
    }
    const updateMeDto = plainToInstance(UpdateUserDto, rawData);
    const errors = await validate(updateMeDto);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          Object.values(errors[0].constraints || {})[0] || 'Validation failed',
        errorDetails: errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
        })),
      });
    }

    const result = await this.userService.updateMe(req.user.id, updateMeDto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Profile updated successfully',
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

  @Post('progress/:courseId/:contentId')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
  async setProgress(@Param() param, @Req() req: Request, @Res() res: Response) {
    const result = await this.userService.setProgress(
      param.courseId,
      req.user,
      param.contentId,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Progress calculated successfully.',
      data: result,
    });
  }

  @Get('progress/:courseId')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
  async getProgress(@Param() param, @Req() req: Request, @Res() res: Response) {
    const result = await this.userService.getProgress(param.courseId, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Progress retrieved successfully',
      data: result,
    });
  }
}
