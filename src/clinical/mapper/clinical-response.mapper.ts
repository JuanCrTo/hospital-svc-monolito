import { Encounter } from '../model/encounter.entity'
import { ClinicalNote } from '../model/clinical-note.entity'
import { VitalSign } from '../model/vital-sign.entity'
import { Diagnosis } from '../model/diagnosis.entity'
import { EncounterResponseDto } from '../dto/response/encounter-response.dto'
import { ClinicalNoteResponseDto } from '../dto/response/clinical-note-response.dto'
import { VitalSignResponseDto } from '../dto/response/vital-sign-response.dto'
import { DiagnosisResponseDto } from '../dto/response/diagnosis-response.dto'

export function mapEncounterToDto(
  encounter: Encounter,
  relations?: { notes?: ClinicalNote[]; vitalSigns?: VitalSign[]; diagnoses?: Diagnosis[] }
): EncounterResponseDto {
  return {
    id: encounter.id,
    facilityId: encounter.facilityId,
    patientId: encounter.patientId,
    providerId: encounter.providerUserId,
    appointmentId: encounter.appointmentId,
    reason: encounter.reason,
    status: encounter.status,
    openedAt: encounter.openedAt,
    openedBy: encounter.openedBy,
    closedAt: encounter.closedAt,
    closedBy: encounter.closedBy,
    createdAt: encounter.createdAt,
    updatedAt: encounter.updatedAt,
    notes: relations?.notes?.map(mapClinicalNoteToDto),
    vitalSigns: relations?.vitalSigns?.map(mapVitalSignToDto),
    diagnoses: relations?.diagnoses?.map(mapDiagnosisToDto)
  }
}

export function mapClinicalNoteToDto(note: ClinicalNote): ClinicalNoteResponseDto {
  return {
    id: note.id,
    encounterId: note.encounterId,
    authorId: note.authorUserId,
    noteType: note.noteType,
    content: note.content,
    amendsNoteId: note.amendsNoteId,
    amendmentReason: note.amendmentReason,
    createdAt: note.createdAt
  }
}

export function mapVitalSignToDto(vitalSign: VitalSign): VitalSignResponseDto {
  return {
    id: vitalSign.id,
    encounterId: vitalSign.encounterId,
    recordedBy: vitalSign.recordedBy,
    measuredAt: vitalSign.measuredAt,
    temperature: vitalSign.temperature,
    systolic: vitalSign.systolic,
    diastolic: vitalSign.diastolic,
    heartRate: vitalSign.heartRate,
    respiratoryRate: vitalSign.respiratoryRate,
    oxygenSaturation: vitalSign.oxygenSaturation,
    weight: vitalSign.weight,
    height: vitalSign.height,
    createdAt: vitalSign.createdAt
  }
}

export function mapDiagnosisToDto(diagnosis: Diagnosis): DiagnosisResponseDto {
  return {
    id: diagnosis.id,
    encounterId: diagnosis.encounterId,
    code: diagnosis.code,
    description: diagnosis.description,
    diagnosisType: diagnosis.diagnosisType,
    diagnosedBy: diagnosis.diagnosedBy,
    diagnosedAt: diagnosis.diagnosedAt,
    amendsDiagnosisId: diagnosis.amendsDiagnosisId,
    amendmentReason: diagnosis.amendmentReason,
    createdAt: diagnosis.createdAt
  }
}
