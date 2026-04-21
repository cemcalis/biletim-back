import { Body, Controller, Get, Headers, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserAuthGuard } from './user-auth.guard';
import { CurrentUser } from './current-user.decorator';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }

  @Post('google')
  async google(@Body('token') token: string) {
    return await this.authService.googleAuth({ token });
  }

  @Post('forgot')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.authService.forgotPassword(body);
  }

  @Post('reset')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.authService.resetPassword(body);
  }

  @Post('logout')
  async logout(@Headers('authorization') authorization?: string) {
    return this.authService.logout(authorization ?? '');
  }

  @Get('profile')
  @UseGuards(UserAuthGuard)
  async getProfile(@CurrentUser() user: { userId: string }) {
    return this.authService.getProfile(user.userId);
  }

  @Patch('profile')
  @UseGuards(UserAuthGuard)
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() body: { name?: string; email?: string; phone?: string },
  ) {
    return this.authService.updateProfile(user.userId, body);
  }
}
