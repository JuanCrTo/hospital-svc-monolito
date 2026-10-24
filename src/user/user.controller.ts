import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, NotFoundException } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/request/create-user-request.dto'
import { ChangePasswordRequestDto } from './dto/request/change-password-user-request.dto'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { RequirePermission } from '../decorators/request/require-permission.decorator'
import { CurrentUser } from '../decorators/request/current-user.decorator'
import { AuthContext } from 'src/iam/interfaces/auth-context.interface'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { UserDetailsResponseDto } from './dto/response/user-details-response.dto'
import { UserResumenResponseDto } from './dto/response/user-resumen-response.dto'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('JWT-auth')
  @Post()
  @HttpCode(201)
  @RequirePermission('user:write')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiStandardResponse(UserDetailsResponseDto, 201)
  @ApiStandardError()
  @ApiBody({ description: 'User data', type: CreateUserDto })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserDetailsResponseDto> {
    return this.userService.create(createUserDto)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @RequirePermission('user:read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiStandardResponse(UserDetailsResponseDto, 200)
  @ApiStandardError()
  async findUserById(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<UserDetailsResponseDto> {
    const user = await this.userService.findByIdForTenant(id, ctx.tenantId)
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  @ApiBearerAuth('JWT-auth')
  @Get()
  @RequirePermission('user:read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all users or filter by email' })
  @ApiQuery({ name: 'email', required: false, description: 'Filter by user email' })
  @ApiStandardResponse(UserResumenResponseDto, 200)
  @ApiStandardError()
  async findAll(@CurrentUser() ctx: AuthContext, @Query('email') email?: string): Promise<UserResumenResponseDto[] | UserDetailsResponseDto> {
    if (email) {
      const user = await this.userService.findByEmailForTenant(email, ctx.tenantId)
      if (!user) {
        throw new NotFoundException(`Usuario con email ${email} no encontrado`)
      }
      return user
    }
    return this.userService.findAllForTenant(ctx.tenantId)
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id/password')
  @RequirePermission('user:write')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update user password' })
  @ApiStandardResponse(UserResumenResponseDto, 200)
  @ApiStandardError()
  @ApiBody({ description: 'New password', type: ChangePasswordRequestDto })
  async updatePassword(
    @CurrentUser() ctx: AuthContext,
    @Param('id') id: string,
    @Body() { password }: ChangePasswordRequestDto
  ): Promise<UserResumenResponseDto> {
    const user = await this.userService.updatePasswordForTenant(id, ctx.tenantId, password)
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @RequirePermission('user:write')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiStandardResponse(null, 204)
  @ApiStandardError()
  async deleteById(@CurrentUser() ctx: AuthContext, @Param('id') id: string): Promise<void> {
    const deleted = await this.userService.deleteForTenant(id, ctx.tenantId)
    if (!deleted) throw new NotFoundException('User not found')
  }
}
