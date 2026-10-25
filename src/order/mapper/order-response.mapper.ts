import { ClinicalOrder } from '../model/clinical-order.entity'
import { LabResult } from '../model/lab-result.entity'
import { ImagingStudy } from '../model/imaging-study.entity'
import { Attachment } from '../model/attachment.entity'
import { ClinicalOrderResponseDto } from '../dto/response/clinical-order-response.dto'
import { LabResultResponseDto } from '../dto/response/lab-result-response.dto'
import { ImagingStudyResponseDto } from '../dto/response/imaging-study-response.dto'
import { AttachmentResponseDto } from '../dto/response/attachment-response.dto'

export function mapClinicalOrderToDto(
  order: ClinicalOrder,
  relations?: { labResults?: LabResult[]; imagingStudies?: ImagingStudy[]; attachments?: Attachment[] }
): ClinicalOrderResponseDto {
  return {
    id: order.id,
    facilityId: order.facilityId,
    encounterId: order.encounterId,
    patientId: order.patientId,
    orderedBy: order.orderedBy,
    orderType: order.orderType,
    code: order.code,
    name: order.name,
    priority: order.priority,
    status: order.status,
    clinicalNotes: order.clinicalNotes,
    requestedAt: order.requestedAt,
    startedAt: order.startedAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    cancelledBy: order.cancelledBy,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    labResults: relations?.labResults?.map(mapLabResultToDto),
    imagingStudies: relations?.imagingStudies?.map(mapImagingStudyToDto),
    attachments: relations?.attachments?.map(mapAttachmentToDto)
  }
}

export function mapLabResultToDto(result: LabResult): LabResultResponseDto {
  return {
    id: result.id,
    orderId: result.orderId,
    analyteCode: result.analyteCode,
    analyteName: result.analyteName,
    value: result.value,
    unit: result.unit,
    referenceRange: result.referenceRange,
    interpretation: result.interpretation,
    status: result.status,
    reportedBy: result.reportedBy,
    reportedAt: result.reportedAt,
    amendsResultId: result.amendsResultId,
    amendmentReason: result.amendmentReason,
    createdAt: result.createdAt
  }
}

export function mapImagingStudyToDto(study: ImagingStudy): ImagingStudyResponseDto {
  return {
    id: study.id,
    orderId: study.orderId,
    studyType: study.studyType,
    modality: study.modality,
    bodySite: study.bodySite,
    findings: study.findings,
    impression: study.impression,
    performedAt: study.performedAt,
    status: study.status,
    reportedBy: study.reportedBy,
    reportedAt: study.reportedAt,
    amendsStudyId: study.amendsStudyId,
    amendmentReason: study.amendmentReason,
    createdAt: study.createdAt
  }
}

export function mapAttachmentToDto(attachment: Attachment): AttachmentResponseDto {
  return {
    id: attachment.id,
    orderId: attachment.orderId,
    labResultId: attachment.labResultId,
    imagingStudyId: attachment.imagingStudyId,
    category: attachment.category,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    checksumSha256: attachment.checksumSha256,
    uploadedBy: attachment.uploadedBy,
    createdAt: attachment.createdAt
  }
}
