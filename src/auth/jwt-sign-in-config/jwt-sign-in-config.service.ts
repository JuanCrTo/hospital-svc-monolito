import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtOptionsFactory } from '@nestjs/jwt'

@Injectable()
export class JwtSignInConfigService implements JwtOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createJwtOptions() {
    return {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      signOptions: { expiresIn: '15m' }
    }
  }
}
