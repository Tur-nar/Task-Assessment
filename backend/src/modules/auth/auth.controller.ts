import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../lib/common/guards/jwt-auth.guard';
import { ResponseMessage } from '../../lib/common/decorators/response-message';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  @Post('login')
  @ResponseMessage('Login successful')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('User profile retrieved successfully')
  async me(@Req() req: any) {
    return this.auth.me(req.user.id);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Password changed successfully')
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
