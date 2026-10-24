import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common'
import { Public } from '../decorators/request/public.decorator'
import { AuthService } from './auth.service'
import { SignInRequestDto } from './dto/request/signIn-auth-request.dto'
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger'
import { SignInResponseDto } from './dto/response/signIn-auth-response.dto'
import { ForgotPasswordRequestDto } from './dto/request/forgotPassword-auth-request.dto'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { Request } from 'express'
import { RefreshTokenRequestDto } from './dto/request/refresh-token-auth-request.dto'
import { SelectContextRequestDto } from './dto/request/select-context-auth-request.dto'
import { SelectContextResponseDto } from './dto/response/select-context-auth-response.dto'
import { CurrentUser } from 'src/decorators/request/current-user.decorator'
import { AuthContext } from 'src/iam/interfaces/auth-context.interface'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-in')
  @HttpCode(201)
  @ApiOperation({ summary: 'Sign in a user' })
  @ApiStandardResponse(SignInResponseDto, 201)
  @ApiStandardError()
  @ApiBody({
    description: 'User credentials',
    type: SignInRequestDto
  })
  async signIn(@Body() credentials: SignInRequestDto, @Req() request: Request): Promise<SignInResponseDto> {
    return this.authService.signIn(credentials.email, credentials.password, this.tokenMeta(request))
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate a refresh token and issue a new access token' })
  @ApiStandardResponse(SignInResponseDto, 200)
  @ApiStandardError()
  async refresh(@Body() dto: RefreshTokenRequestDto, @Req() request: Request): Promise<SignInResponseDto> {
    return this.authService.refresh(dto.refreshToken, this.tokenMeta(request))
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke a refresh token family' })
  @ApiStandardResponse(null, 204)
  @ApiStandardError()
  async logout(@Body() dto: RefreshTokenRequestDto): Promise<void> {
    return this.authService.logout(dto.refreshToken)
  }

  @ApiBearerAuth('JWT-auth')
  @Post('context')
  @HttpCode(200)
  @ApiOperation({ summary: 'Switch active tenant/facility context and issue a new access token' })
  @ApiStandardResponse(SelectContextResponseDto, 200)
  @ApiStandardError()
  async selectContext(@CurrentUser() user: AuthContext, @Body() dto: SelectContextRequestDto): Promise<SelectContextResponseDto> {
    return this.authService.selectContext(user.userId, dto)
  }

  @Public()
  @Post('password-reset')
  @HttpCode(201)
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiStandardResponse(null, 201)
  @ApiStandardError()
  @ApiBody({
    description: 'User email',
    type: ForgotPasswordRequestDto
  })
  async forgotPassword(@Body() { email }: ForgotPasswordRequestDto) {
    return this.authService.handleForgotPassword(email)
  }

  private tokenMeta(request: Request) {
    const forwarded = request.headers['x-forwarded-for']
    const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
    return {
      ip: forwardedIp?.trim() || request.ip || request.socket?.remoteAddress || null,
      userAgent: request.headers['user-agent'] ?? null
    }
  }
}
