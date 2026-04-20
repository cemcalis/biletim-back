import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
	) {}

	async getProfile(userId: string) {
		const user = await this.userRepository.findOne({
			where: { id: userId },
			select: ['id', 'name', 'email', 'isCompany', 'createdAt', 'updatedAt'],
		});

		if (!user) {
			throw new NotFoundException('Kullanici bulunamadi');
		}

		return user;
	}
}
