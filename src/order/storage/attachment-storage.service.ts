import { Readable } from 'stream'

export interface UploadAttachmentInput {
  buffer: Buffer
  originalName: string
  mimeType: string
  tenantId: string
  facilityId: string
  orderId: string
}

export interface StoredAttachment {
  publicId: string
  resourceType: string
  format: string
  sizeBytes: number
  checksumSha256: string
}

export abstract class AttachmentStorageService {
  abstract upload(input: UploadAttachmentInput): Promise<StoredAttachment>
  abstract openDownload(publicId: string, format: string, resourceType: string): Promise<Readable>
}
