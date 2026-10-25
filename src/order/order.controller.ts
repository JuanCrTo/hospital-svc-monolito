import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { Response } from 'express'
import { CurrentUser } from 'src/decorators/request/current-user.decorator'
import { RequirePermission } from 'src/decorators/request/require-permission.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { AuthContext } from 'src/iam/interfaces/auth-context.interface'
import { OrderService, UploadedFileLike } from './order.service'
import { CreateOrderRequestDto } from './dto/request/create-order-request.dto'
import { UpdateOrderStatusRequestDto } from './dto/request/update-order-status-request.dto'
import { CreateLabResultRequestDto } from './dto/request/create-lab-result-request.dto'
import { CreateImagingStudyRequestDto } from './dto/request/create-imaging-study-request.dto'
import { UploadAttachmentRequestDto } from './dto/request/upload-attachment-request.dto'
import { ClinicalOrderResponseDto } from './dto/response/clinical-order-response.dto'
import { LabResultResponseDto } from './dto/response/lab-result-response.dto'
import { ImagingStudyResponseDto } from './dto/response/imaging-study-response.dto'
import { AttachmentResponseDto } from './dto/response/attachment-response.dto'
import { ClinicalOrderPriority, ClinicalOrderStatus, ClinicalOrderType } from './model/clinical-order.entity'

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

@Controller('clinical/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiBearerAuth('JWT-auth')
  @Post()
  @HttpCode(201)
  @RequirePermission('order:write')
  @ApiOperation({ summary: 'Create a clinical order for an open encounter' })
  @ApiStandardResponse(ClinicalOrderResponseDto, 201)
  @ApiStandardError()
  async create(@CurrentUser() ctx: AuthContext, @Body() dto: CreateOrderRequestDto): Promise<ClinicalOrderResponseDto> {
    return this.orderService.createOrder(dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get()
  @HttpCode(200)
  @RequirePermission('order:read')
  @ApiOperation({ summary: 'List clinical orders' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'encounterId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['requested', 'in_progress', 'completed', 'cancelled'] })
  @ApiQuery({ name: 'orderType', required: false, enum: ['lab', 'imaging'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['routine', 'urgent', 'stat'] })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date lower bound' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date upper bound' })
  @ApiStandardResponse(ClinicalOrderResponseDto, 200)
  @ApiStandardError()
  async findAll(
    @CurrentUser() ctx: AuthContext,
    @Query('patientId') patientId?: string,
    @Query('encounterId') encounterId?: string,
    @Query('status') status?: ClinicalOrderStatus,
    @Query('orderType') orderType?: ClinicalOrderType,
    @Query('priority') priority?: ClinicalOrderPriority,
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<ClinicalOrderResponseDto[]> {
    return this.orderService.findAll(ctx.tenantId, ctx.facilityId, { patientId, encounterId, status, orderType, priority, from, to })
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @HttpCode(200)
  @RequirePermission('order:read')
  @ApiOperation({ summary: 'Get an order with results, studies and attachment metadata' })
  @ApiStandardResponse(ClinicalOrderResponseDto, 200)
  @ApiStandardError()
  async findById(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<ClinicalOrderResponseDto> {
    return this.orderService.findById(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id/status')
  @HttpCode(200)
  @RequirePermission('order:write')
  @ApiOperation({ summary: 'Start, complete or cancel an order' })
  @ApiStandardResponse(ClinicalOrderResponseDto, 200)
  @ApiStandardError()
  async updateStatus(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusRequestDto
  ): Promise<ClinicalOrderResponseDto> {
    return this.orderService.updateStatus(id, dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/lab-results')
  @HttpCode(201)
  @RequirePermission('result:write')
  @ApiOperation({ summary: 'Append a laboratory result or correction' })
  @ApiStandardResponse(LabResultResponseDto, 201)
  @ApiStandardError()
  async addLabResult(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateLabResultRequestDto
  ): Promise<LabResultResponseDto> {
    return this.orderService.addLabResult(id, dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id/lab-results')
  @HttpCode(200)
  @RequirePermission('result:read')
  @ApiOperation({ summary: 'List laboratory results' })
  @ApiStandardResponse(LabResultResponseDto, 200)
  @ApiStandardError()
  async findLabResults(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<LabResultResponseDto[]> {
    return this.orderService.findLabResults(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/imaging-studies')
  @HttpCode(201)
  @RequirePermission('result:write')
  @ApiOperation({ summary: 'Append an imaging study or correction' })
  @ApiStandardResponse(ImagingStudyResponseDto, 201)
  @ApiStandardError()
  async addImagingStudy(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateImagingStudyRequestDto
  ): Promise<ImagingStudyResponseDto> {
    return this.orderService.addImagingStudy(id, dto, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id/imaging-studies')
  @HttpCode(200)
  @RequirePermission('result:read')
  @ApiOperation({ summary: 'List imaging studies' })
  @ApiStandardResponse(ImagingStudyResponseDto, 200)
  @ApiStandardError()
  async findImagingStudies(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<ImagingStudyResponseDto[]> {
    return this.orderService.findImagingStudies(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/attachments')
  @HttpCode(201)
  @RequirePermission('attachment:write')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string', enum: ['order', 'lab_result', 'imaging'] },
        labResultId: { type: 'string', format: 'uuid' },
        imagingStudyId: { type: 'string', format: 'uuid' }
      }
    }
  })
  @ApiOperation({ summary: 'Upload a private attachment to Cloudinary' })
  @ApiStandardResponse(AttachmentResponseDto, 201)
  @ApiStandardError()
  async uploadAttachment(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() dto: UploadAttachmentRequestDto,
    @UploadedFile() file: UploadedFileLike
  ): Promise<AttachmentResponseDto> {
    return this.orderService.uploadAttachment(id, dto, file, ctx.tenantId, ctx.facilityId, ctx.userId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id/attachments')
  @HttpCode(200)
  @RequirePermission('attachment:read')
  @ApiOperation({ summary: 'List attachment metadata' })
  @ApiStandardResponse(AttachmentResponseDto, 200)
  @ApiStandardError()
  async findAttachments(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<AttachmentResponseDto[]> {
    return this.orderService.findAttachments(id, ctx.tenantId, ctx.facilityId)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id/attachments/:attachmentId/download')
  @RequirePermission('attachment:read')
  @ApiOperation({ summary: 'Download an attachment through an authenticated private stream' })
  @ApiStandardError()
  async downloadAttachment(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response
  ): Promise<void> {
    const download = await this.orderService.downloadAttachment(id, attachmentId, ctx.tenantId, ctx.facilityId)
    res.setHeader('Content-Type', download.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${download.fileName}"`)
    download.stream.pipe(res)
  }
}
