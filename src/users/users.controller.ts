import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@UseGuards(UserAuthGuard)
	@Get('me')
	async me(@CurrentUser() user: { userId: string; email: string }) {
		return await this.usersService.getProfile(user.userId);
	}

	@UseGuards(UserAuthGuard)
	@Patch('me')
	async updateMe(
		@CurrentUser() user: { userId: string; email: string },
		@Body() body: UpdateUserDto,
	) {
		return await this.usersService.updateProfile(user.userId, body);
	}

	@UseGuards(UserAuthGuard)
	@Patch('me/password')
	async updateMyPassword(
		@CurrentUser() user: { userId: string; email: string },
		@Body() body: ChangePasswordDto,
	) {
		return await this.usersService.changePassword(user.userId, body);
	}
}
