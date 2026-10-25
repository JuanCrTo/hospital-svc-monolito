import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from 'src/common/logging/logger.module'
import { Encounter } from 'src/clinical/model/encounter.entity'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'
import { ClinicalOrder } from './model/clinical-order.entity'
import { LabResult } from './model/lab-result.entity'
import { ImagingStudy } from './model/imaging-study.entity'
import { Attachment } from './model/attachment.entity'
import { AttachmentStorageService } from './storage/attachment-storage.service'
import { CloudinaryAttachmentStorageService } from './storage/cloudinary-attachment-storage.service'

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalOrder, LabResult, ImagingStudy, Attachment, Encounter]), LoggerModule],
  controllers: [OrderController],
  providers: [OrderService, { provide: AttachmentStorageService, useClass: CloudinaryAttachmentStorageService }],
  exports: [OrderService, TypeOrmModule]
})
export class OrderModule {}
