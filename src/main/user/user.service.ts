import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Server } from 'http';
import { TUser } from 'src/interface/token.type';
import { LibService } from 'src/lib/lib.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './user.dto';
import { Developer, Status, User, UserProgramStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from 'src/utils/sendMail';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lib: LibService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  // ------------------------------- Get Me -------------------------------
  public async getMe(user: TUser) {
    if (
      user.userType !== 'SUPER_ADMIN' &&
      user.userType !== 'DEVELOPER' &&
      user.userType !== 'SERVER' &&
      user.userType !== 'ADMIN'
    ) {
      throw new HttpException(
        'Invalid User role provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.userType === 'DEVELOPER') {
      const developer = await this.prisma.developer.findUniqueOrThrow({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { user: true },
      });

      return {
        userId: developer.user.id,
        status: developer.status,
        user: developer.user,
      };
    }

    if (user.userType === 'SERVER') {
      const server = await this.prisma.server.findUniqueOrThrow({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { user: true },
      });

      return {
        userId: server.user.id,
        status: server.status,
        user: server.user,
      };
    }

    if (user.userType === 'ADMIN') {
      const admin = await this.prisma.admin.findUniqueOrThrow({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { user: true },
      });

      return {
        userId: admin.user.id,
        status: admin.status,
        user: admin.user,
      };
    }

    // SUPER_ADMIN fallback
    const superAdmin = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id, status: 'ACTIVE' },
    });

    return {
      userId: superAdmin.id,
      status: superAdmin.status,
      user: superAdmin,
    };
  }

  // ------------------------------- Get All Users -------------------------------
  public async getAllUsers() {
    const result = await this.prisma.user.findMany();
    return result;
  }

  // ------------------------------- Change User Status -------------------------------
  public async changeUserStatus(id: string, status: Status) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status },
    });
    return updatedUser;
  }

  // --------------------------------------- Create User ---------------------------------
  public async registerUser(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const token = this.jwtService.sign(
      { email: dto.email },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: 2592000000 },
    );

    if (existingUser && !existingUser.isVerified) {
      const verificationLink = `${this.configService.get(
        'FRONTEND_URL',
      )}/user-create-password?token=${token}`;

      await this.mailerService.sendMail(
        dto.email,
        `<div>
          <p>Hello ${dto.firstName},</p>
          <p>Click the button below to verify your email and complete registration. This link will expire in 10 minutes.</p>
          <p><a href="${verificationLink}"><button>Verify Email</button></a></p>
        </div>`,
        'Email Verification Link 🔗',
        'Click on the link to verify email, and create your password. Link expires in 10 minutes.',
      );

      return null;
    }

    const state = await this.prisma.state.findUnique({
      where: { id: dto.stateId },
    });
    if (!state) {
      throw new HttpException('Invalid stateId', HttpStatus.BAD_REQUEST);
    }

    if (state.countryId !== dto.countryId) {
      throw new HttpException(
        'StateId does not belong to the provided countryId',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          sex: dto.sex,
          companyName: dto.companyName,
          otherName: dto.otherName,
          email: dto.email,
          profile_photo: dto.profile_photo,
          streetNumber: dto.streetNumber,
          street: dto.street,
          postalCode: dto.postalCode,
          city: dto.city,
          countryId: dto.countryId,
          stateId: dto.stateId,
          userType: dto.userType,
        },
      });
      if (dto.userType === 'DEVELOPER') {
        await tx.developer.create({
          data: {
            userId: user.id,
            email: user.email,
          },
        });
      } else if (dto.userType === 'SERVER') {
        await tx.server.create({
          data: {
            userId: user.id,
            email: user.email,
          },
        });
      }
    });

    const verificationLink = `${this.configService.get(
      'FRONTEND_URL',
    )}/user-create-password?token=${token}`;

    await this.mailerService.sendMail(
      dto.email,
      `<div>
        <p>Hello ${dto.firstName},</p>
        <p>Click the button below to verify your email and complete registration. This link will expire in 10 minutes.</p>
        <p><a href="${verificationLink}"><button>Verify Email</button></a></p>
      </div>`,
      'Email Verification Link 🔗',
      'Click on the link to verify email, and create your password. Link expires in 10 minutes.',
    );

    return null;
  }

  // ------------------------------- Update User -------------------------------
  public async updateMe(id: string, data: Partial<CreateUserDto>) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    const result = await this.prisma.user.update({
      where: { id },
      data,
    });
    return result;
  }

  // ------------------------------- Create Password -------------------------------
  public async createPassword(
    data: { email: string; password: string },
    token: string,
  ) {
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new HttpException(
        'Invalid or expired verification token.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.email !== payload.email)
      throw new HttpException(
        'Invalid Email Provided!',
        HttpStatus.UNAUTHORIZED,
      );

    const existingUser = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!existingUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // if (!!existingUser.password) {
    //   throw new HttpException(
    //     'Password already set for this user!',
    //     HttpStatus.NOT_FOUND,
    //   );
    // }

    const hashedPassword = await this.lib.hashPassword({
      password: data.password,
      round: 6,
    });

    const updatedUser = await this.prisma.user.update({
      where: { email: payload.email },
      data: { password: hashedPassword, isVerified: true },
    });

    // If the user is a DEVELOPER or SERVER, create userProgram records
    if (
      updatedUser.userType === 'DEVELOPER' ||
      updatedUser.userType === 'SERVER'
    ) {
      const programs = await this.prisma.program.findMany({
        where: { publishedFor: updatedUser.userType },
        select: { id: true },
      });
      // Prepare userProgram records
      const userProgramsData = programs.map((program) => ({
        userId: updatedUser.id,
        programId: program.id,
      }));
      // Create all userPrograms
      if (userProgramsData.length > 0) {
        await this.prisma.userProgram.createMany({
          data: userProgramsData,
          skipDuplicates: true,
        });
      }
    }
    return updatedUser;
  }

  private async checkAndPromoteIfCertified(userId: string, programId: string) {
    // console.log('🎯 Re-checking for full program certification...');

    const programCourses = await this.prisma.course.findMany({
      where: { programId },
      select: { id: true },
    });

    const programCourseIds = programCourses.map((course) => course.id);
    // console.log('📘 Program Courses:', programCourseIds);

    const userProgresses = await this.prisma.progress.findMany({
      where: {
        userId,
        courseId: { in: programCourseIds },
      },
      select: { courseId: true, percentage: true },
    });

    // console.log('📈 User Progresses:', userProgresses);

    const allCompleted = programCourseIds.every((courseId) =>
      userProgresses.some(
        (progress) =>
          progress.courseId === courseId && progress.percentage === 100,
      ),
    );

    // console.log('✅ All program courses completed:', allCompleted);

    if (allCompleted) {
      // console.log('🏅 Promoting user to CERTIFIED');

      await this.prisma.$transaction(async (tx) => {
        await tx.userProgram.update({
          where: {
            userId_programId: {
              userId,
              programId,
            },
          },
          data: {
            status: UserProgramStatus.CERTIFIED,
          },
        });

        const userToPromote = await tx.user.findUnique({
          where: { id: userId },
          select: { level: true },
        });

        if (userToPromote?.level !== 'CERTIFIED') {
          await tx.user.update({
            where: { id: userId },
            data: { level: 'CERTIFIED' },
          });
          // console.log(`🎓 User ${userId} upgraded to CERTIFIED`);
        } else {
          // console.log(`ℹ️ User ${userId} already CERTIFIED`);
        }
      });
    }
  }

  //----------------------------------------Set Progress--------------------------------------------------
  public async setProgress(courseId: string, user: TUser, contentId: string) {
    // console.log('▶️ setProgress triggered');
    // console.log('👤 User:', user.id);
    // console.log('📘 Course:', courseId);
    // console.log('📄 Content:', contentId);

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id, status: 'ACTIVE' },
      include: {
        enrolledPrograms: true,
      },
    });
    if (!userRecord)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (userRecord.enrolledPrograms.length === 0)
      throw new HttpException(
        'No enrolled courses found for this user',
        HttpStatus.NOT_FOUND,
      );

    const courseProgram = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { programId: true },
    });
    if (!courseProgram?.programId)
      throw new HttpException(
        'Course not found or has no associated program',
        HttpStatus.NOT_FOUND,
      );

    const isEnrolled = await this.prisma.userProgram.findUnique({
      where: {
        userId_programId: {
          userId: user.id,
          programId: courseProgram.programId,
        },
      },
    });

    if (!isEnrolled || isEnrolled.status === UserProgramStatus.BASIC)
      throw new HttpException(
        'You are not enrolled in this course',
        HttpStatus.BAD_REQUEST,
      );

    const modules = await this.prisma.module.findMany({
      where: { courseId },
      include: {
        contents: {
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        },
      },
    });

    const contentIds = modules.flatMap((module) =>
      module.contents.map((content) => content.id),
    );
    // console.log('🧾 All contents:', contentIds);

    const index = contentIds.findIndex((content) => content === contentId);
    if (index === -1)
      throw new HttpException('Content not found in enrolled course.', 401);

    const existingProgress = await this.prisma.progress.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (!existingProgress && contentIds[0] !== contentId)
      throw new HttpException(
        'This content is locked. Start from the first content.',
        403,
      );

    const prevIndex = contentIds.findIndex(
      (content) => content === existingProgress?.contentId,
    );

    if (existingProgress && index - 1 > prevIndex) {
      throw new HttpException(
        {
          message:
            'This content is locked. Please complete previous contents first.',
          statusCode: 403,
          errorType: 'LOCKED_CONTENT',
          requiredContentId: contentIds[prevIndex + 1] ?? null,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (existingProgress && index <= prevIndex) {
      // console.log(
      //   '⚠️ Skipping update: Already watched or behind current progress',
      // );
      // console.log('📌 currentIndex:', index, '| prevIndex:', prevIndex);
      // console.log('📈 existingPercentage:', existingProgress.percentage);

      // ⚠️ Even if progress not updated, still check if promotion is needed
      if (existingProgress.percentage === 100) {
        await this.checkAndPromoteIfCertified(user.id, courseProgram.programId);
      }

      return {
        watchedContents: contentIds.slice(0, prevIndex + 1),
        percentage: existingProgress.percentage,
      };
    }
    const percentage = Math.round(((index + 1) / contentIds.length) * 100);
    // console.log('📊 Updated percentage:', percentage);

    await this.prisma.progress.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: { percentage, contentId },
      create: { userId: user.id, courseId, percentage, contentId },
    });
    // ✅ Check for full program completion
    if (percentage === 100) {
      // console.log('🎯 Checking full program completion');

      const programCourses = await this.prisma.course.findMany({
        where: { programId: courseProgram.programId },
        select: { id: true },
      });

      const programCourseIds = programCourses.map((course) => course.id);
      // console.log('📘 Program Courses:', programCourseIds);

      const userProgresses = await this.prisma.progress.findMany({
        where: {
          userId: user.id,
          courseId: { in: programCourseIds },
        },
        select: { courseId: true, percentage: true },
      });
      // console.log('📈 User Progresses:', userProgresses);

      const allCompleted = programCourseIds.every((courseId) =>
        userProgresses.some(
          (progress) =>
            progress.courseId === courseId && progress.percentage === 100,
        ),
      );

      // console.log('✅ All program courses completed:', allCompleted);

      if (allCompleted) {
        // console.log('🏅 Promoting user to CERTIFIED');

        await this.prisma.$transaction(async (tx) => {
          await tx.userProgram.update({
            where: {
              userId_programId: {
                userId: user.id,
                programId: courseProgram.programId,
              },
            },
            data: {
              status: UserProgramStatus.CERTIFIED,
            },
          });

          const userToPromote = await tx.user.findUnique({
            where: { id: user.id },
            select: { level: true },
          });

          if (userToPromote?.level !== 'CERTIFIED') {
            await tx.user.update({
              where: { id: user.id },
              data: { level: 'CERTIFIED' },
            });
            // console.log(`🎓 User ${user.id} upgraded to CERTIFIED`);
          } else {
            // console.log(`ℹ️ User ${user.id} already CERTIFIED`);
          }
        });
      }
    }

    const watchedContents = contentIds.slice(0, index + 1);
    return {
      watchedContents,
      percentage,
    };
  }

  //----------------------------------------Get Progress-------------------------------------------------
  public async getProgress(courseId: string, user: TUser) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: user.id, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!existingUser) {
      throw new HttpException('User not found', 404);
    }

    // Check if the student is enrolled in the program (optional)
    const isProgramEnrolled = await this.prisma.userProgram.findFirst({
      where: {
        userId: user.id,
        program: {
          courses: {
            some: {
              id: courseId,
            },
          },
        },
        status: { not: UserProgramStatus.BASIC },
      },
    });

    if (!isProgramEnrolled) {
      throw new HttpException(
        'You are not enrolled in this course',
        HttpStatus.FORBIDDEN,
      );
    }

    const courseProgress = await this.prisma.progress.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
      select: {
        percentage: true,
        contentId: true,
      },
    });

    // Get ordered contents of the course
    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
      include: {
        contents: {
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        },
      },
    });

    const contentIds = modules.flatMap((module) =>
      module.contents.map((content) => content.id),
    );

    if (!courseProgress) {
      return { watchedContents: [], percentage: 0 };
    }

    const currentIndex = contentIds.findIndex(
      (cid) => cid === courseProgress.contentId,
    );

    const watchedContents = contentIds.slice(0, currentIndex + 1);
    const recalculatedPercentage =
      contentIds.length === 0
        ? 0
        : Math.round(((currentIndex + 1) / contentIds.length) * 100);

    if (recalculatedPercentage !== courseProgress.percentage) {
      await this.prisma.progress.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
        data: {
          percentage: recalculatedPercentage,
        },
      });
    }

    return {
      watchedContents,
      percentage: recalculatedPercentage,
    };
  }
}
