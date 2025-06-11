import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { UserRole } from '@prisma/client';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { CreateCourseDto, UpdateCourseDto } from './course.dto';
import { IdDto } from 'src/common/id.dto';
import sendResponse from 'src/utils/sendResponse';
import { Request, Response } from 'express';
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { plainToInstance } from 'class-transformer';
import { LibService } from 'src/lib/lib.service';
import { validate } from 'class-validator';

@Controller('course')
export class CourseController {
  constructor(
    private courseService: CourseService,
    private readonly lib: LibService,
  ) {}

  // Create Course
  @Post()
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async createCourse(
    @Req() req: Request,
    @Res() res: Response,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    const parsed = JSON.parse(text);
    const createCourseDto = plainToInstance(CreateCourseDto, parsed);

    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        createCourseDto.thumbnail = uploaded.secure_url;
      }
    }
    await validate(createCourseDto);
    const result = await this.courseService.createCourse(
      createCourseDto,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Course created successfully',
      data: result,
    });
  }

  // Get single Course
  @Get(':id')
  @UseGuards(AuthGuard)
  public async getSingleCourse(
    @Res() res: Response,
    @Param() param: IdDto,
    @Req() req: Request,
  ) {
    const result = await this.courseService.getSingleCourse(param.id, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Course retrieved successfully',
      data: result,
    });
  }

  // Get all Courses
  @Get()
  async getAllCourses(@Res() res: Response, @Req() req: Request) {
    const result = await this.courseService.getAllCourses();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'All courses retrieved successfully',
      data: result,
    });
  }

  // Update Course
  @Patch(':id')
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async updateCourse(
    @Req() req: Request,
    @Res() res: Response,
    @Param() param: IdDto,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    let updateCourseDto: any = {};
    if (!text && !file) {
      throw new HttpException(
        'No data provided for update',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (text) {
      const parsed = JSON.parse(text);
      updateCourseDto = plainToInstance(UpdateCourseDto, parsed);
    }
    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        updateCourseDto.thumbnail = uploaded.secure_url;
      }
    }
    const errors = await validate(updateCourseDto);
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
    const result = await this.courseService.updateCourse(
      param.id,
      updateCourseDto,
      req.user
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Course updated successfully',
      data: result,
    });
  }

  // Delete Course
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  public async deleteCourse(@Res() res: Response, @Param() param: IdDto) {
    const result = await this.courseService.deleteCourse(param.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Course deleted successfully',
      data: result,
    });
  }
}
