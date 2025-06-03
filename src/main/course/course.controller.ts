import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
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

@Controller('course')
export class CourseController {
  constructor(private courseService: CourseService) {}

  // Create Course
  @Post()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async createCourse(
    @Res() res: Response,
    @Body() data: CreateCourseDto,
  ) {
    const result = await this.courseService.createCourse(data);
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
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async updateCourse(
    @Res() res: Response,
    @Param() param: IdDto,
    @Body() data: UpdateCourseDto,
  ) {
    const result = await this.courseService.updateCourse(param.id, data);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Course updated successfully',
      data: result,
    });
  }

  // Delete Course
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
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
