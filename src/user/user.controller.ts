import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, NotFoundException } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/request/create-user-request.dto'
import { ChangePasswordRequestDto } from './dto/request/change-password-user-request.dto'
import { Public } from '../decorators/request/public.decorator'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { ApiStandardResponse } from 'src/decorators/swagger/response.decorator'
import { ApiStandardError } from 'src/decorators/swagger/error.decorator'
import { UserDetailsResponseDto } from './dto/response/user-details-response.dto'
import { UserResumenResponseDto } from './dto/response/user-resumen-response.dto'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiStandardResponse(UserDetailsResponseDto, 201)
  @ApiStandardError()
  @ApiBody({ description: 'User data', type: CreateUserDto })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserDetailsResponseDto> {
    return this.userService.create(createUserDto)
  }

  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiStandardResponse(UserDetailsResponseDto, 200)
  @ApiStandardError()
  async findUserById(@Param('id') id: string): Promise<UserDetailsResponseDto> {
    return this.userService.findById(id)
  }

  @ApiBearerAuth('JWT-auth')
  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all users or filter by email' })
  @ApiQuery({ name: 'email', required: false, description: 'Filter by user email' })
  @ApiStandardResponse(UserResumenResponseDto, 200)
  @ApiStandardError()
  async findAll(@Query('email') email?: string): Promise<UserResumenResponseDto[] | UserDetailsResponseDto> {
    if (email) {
      const user = await this.userService.findByEmailDto(email)
      if (!user) {
        throw new NotFoundException(`Usuario con email ${email} no encontrado`)
      }
      return user
    }
    return this.userService.findAll()
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id/password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update user password' })
  @ApiStandardResponse(UserResumenResponseDto, 200)
  @ApiStandardError()
  @ApiBody({ description: 'New password', type: ChangePasswordRequestDto })
  async updatePassword(
    @Param('id') id: string,
    @Body() { password }: ChangePasswordRequestDto
  ): Promise<UserResumenResponseDto> {
    return this.userService.updatePassword(id, password)
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiStandardResponse(null, 204)
  @ApiStandardError()
  async deleteById(@Param('id') id: string): Promise<void> {
    return this.userService.delete(id)
  }
}
