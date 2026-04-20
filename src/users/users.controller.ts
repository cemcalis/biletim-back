import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@UseGuards(UserAuthGuard)
	@Get('me')
	async me(@CurrentUser() user: { userId: string; email: string }) {
		return await this.usersService.getProfile(user.userId);
	}
}
