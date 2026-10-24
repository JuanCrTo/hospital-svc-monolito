import { applyDecorators } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiConflictResponse
} from '@nestjs/swagger'
import { ErrorDto } from 'src/common/dto/error.dto'

export function ApiStandardError() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Petición incorrecta',
      type: ErrorDto,
      examples: {
        badRequest: {
          summary: 'Formato inválido',
          value: {
            timestamp: new Date().toISOString(),
            message: 'El campo email es obligatorio',
            success: false,
            statusCode: 400,
            errorCode: 'VALIDATION_FAILED',
            path: '/api/v1/user',
            data: null
          }
        }
      }
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      type: ErrorDto,
      examples: {
        unauthorized: {
          summary: 'Token inválido o ausente',
          value: {
            timestamp: new Date().toISOString(),
            message: 'Token no proporcionado',
            success: false,
            statusCode: 401,
            errorCode: 'UNAUTHORIZED',
            path: '/api/v1/user',
            data: null
          }
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'No autorizado',
      type: ErrorDto,
      examples: {
        forbidden: {
          summary: 'Acceso denegado',
          value: {
            timestamp: new Date().toISOString(),
            message: 'No tiene permisos para acceder a este recurso',
            success: false,
            statusCode: 403,
            errorCode: 'FORBIDDEN',
            path: '/api/v1/admin',
            data: null
          }
        }
      }
    }),
    ApiNotFoundResponse({
      description: 'Recurso no encontrado',
      type: ErrorDto,
      examples: {
        notFound: {
          summary: 'ID inexistente',
          value: {
            timestamp: new Date().toISOString(),
            message: 'Paciente no encontrado',
            success: false,
            statusCode: 404,
            errorCode: 'NOT_FOUND',
            path: '/api/v1/patient/123',
            data: null
          }
        }
      }
    }),
    ApiConflictResponse({
      description: 'Conflicto',
      type: ErrorDto,
      examples: {
        conflict: {
          summary: 'Email ya registrado',
          value: {
            timestamp: new Date().toISOString(),
            message: 'Ya existe un usuario con este email',
            success: false,
            statusCode: 409,
            errorCode: 'EMAIL_EXISTS',
            path: '/api/v1/user',
            data: null
          }
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno',
      type: ErrorDto,
      examples: {
        internalError: {
          summary: 'Fallo inesperado',
          value: {
            timestamp: new Date().toISOString(),
            message: 'Ocurrió un error inesperado',
            success: false,
            statusCode: 500,
            errorCode: 'INTERNAL_ERROR',
            path: '/api/v1/user',
            data: null
          }
        }
      }
    })
  )
}
