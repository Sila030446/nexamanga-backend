import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TelegramService } from 'src/telegram/telegram.service';
import { formatDateToThaiTime } from 'src/utils/dateTime-convert';

@Injectable()
export class JobService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly sendMessage: TelegramService,
    @InjectQueue('jobsQueue') private readonly jobsQueue: Queue,
  ) {}

  // Method to create a job
  async createJob(createJobDto: Prisma.JobCreateInput) {
    try {
      // เพิ่ม job ลงในฐานข้อมูล
      const createdJob = await this.databaseService.job.create({
        data: createJobDto,
      });

      // ตัวอย่างการใช้ url และ jobType (คุณสามารถแก้ไขข้อมูลได้ตามโครงสร้างจริง)
      const url = createJobDto.url || ''; // ตรวจสอบว่า url ถูกส่งมาหรือไม่
      const jobType = createJobDto.jobType || '';

      // เพิ่ม job ลงในคิว
      await this.jobsQueue.add('new manga', {
        url,
        jobType,
        id: createdJob.id,
      });
      const formattedDate = formatDateToThaiTime(createdJob.createdAt);
      await this.sendMessage.sendMessage(
        `มีการสร้าง job ใหม่: ${url} - ${createdJob.id} \n\n ${formattedDate}`,
      );
      return createdJob;
    } catch (error) {
      throw new HttpException(
        `Failed to create job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Method to find all jobs and count ongoing jobs
  async findAllJobs() {
    try {
      const jobs = await this.databaseService.job.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      const onGoingJobsCount = await this.databaseService.job.count({
        where: {
          isComplete: false,
        },
      });

      return {
        jobs,
        onGoingJobsCount,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve jobs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
