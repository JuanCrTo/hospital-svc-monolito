import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash } from 'crypto'
import { extname } from 'path'
import { Readable } from 'stream'
import axios from 'axios'
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary'
import { v4 as uuidv4 } from 'uuid'
import { AttachmentStorageService, StoredAttachment, UploadAttachmentInput } from './attachment-storage.service'

@Injectable()
export class CloudinaryAttachmentStorageService extends AttachmentStorageService {
  constructor(private readonly configService: ConfigService) {
    super()
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      secure: true
    })
  }

  async upload(input: UploadAttachmentInput): Promise<StoredAttachment> {
    this.assertConfigured()
    const checksumSha256 = createHash('sha256').update(input.buffer).digest('hex')

    const options: UploadApiOptions = {
      resource_type: 'auto',
      type: 'private',
      public_id: `hospital/${input.tenantId}/${input.facilityId}/${input.orderId}/${uuidv4()}`,
      filename_override: input.originalName,
      use_filename: false,
      unique_filename: false,
      overwrite: false,
      tags: ['his', 'clinical-attachment']
    }

    const result = await this.uploadBuffer(input.buffer, options)
    const format = result.format || this.extensionOf(input.originalName)

    return {
      publicId: result.public_id,
      resourceType: result.resource_type,
      format,
      sizeBytes: result.bytes ?? input.buffer.length,
      checksumSha256
    }
  }

  async openDownload(publicId: string, format: string, resourceType: string): Promise<Readable> {
    this.assertConfigured()
    const url = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType as 'image' | 'video' | 'raw',
      type: 'private',
      attachment: false
    })

    try {
      const response = await axios.get<Readable>(url, { responseType: 'stream' })
      return response.data
    } catch {
      throw new InternalServerErrorException('Attachment could not be retrieved from storage')
    }
  }

  private uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) {
          reject(new InternalServerErrorException('Attachment could not be stored'))
          return
        }
        resolve(result)
      })
      stream.end(buffer)
    })
  }

  private assertConfigured(): void {
    const configured = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every(key =>
      Boolean(this.configService.get<string>(key))
    )
    if (!configured) throw new InternalServerErrorException('Attachment storage is not configured')
  }

  private extensionOf(originalName: string): string {
    const extension = extname(originalName).replace('.', '').toLowerCase()
    return extension || 'bin'
  }
}
