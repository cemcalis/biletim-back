import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from '../database/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly authService: AuthService,
	) {}

	async getProfile(userId: string) {
		const user = await this.userRepository.findOne({
			where: { id: userId },
			select: ['id', 'name', 'email', 'phone', 'isCompany', 'createdAt', 'updatedAt'],
		});

		if (!user) {
			throw new NotFoundException('Kullanici bulunamadi');
		}

		return user;
	}

	async updateProfile(userId: string, input: UpdateUserDto) {
		const user = await this.userRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('Kullanici bulunamadi');
		}

		const nextName = input.name?.trim();
		const nextPhone = input.phone?.trim();

		if (!nextName && !nextPhone) {
			throw new BadRequestException('Guncellenecek alan bulunamadi');
		}

		if (nextName) {
			user.name = nextName;
		}

		if (nextPhone) {
			user.phone = nextPhone;
		}

		const saved = await this.userRepository.save(user);
		return {
			id: saved.id,
			name: saved.name,
			email: saved.email,
			phone: saved.phone,
			isCompany: saved.isCompany,
			createdAt: saved.createdAt,
			updatedAt: saved.updatedAt,
		};
	}

	async changePassword(userId: string, input: ChangePasswordDto) {
		const currentPassword = input.currentPassword?.trim();
		const newPassword = input.newPassword?.trim();

		if (!currentPassword || !newPassword) {
			throw new BadRequestException('Mevcut sifre ve yeni sifre zorunludur');
		}

		if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
			throw new BadRequestException(
				'Yeni sifre en az 8 karakter olmalı ve harf ile rakam icermelidir',
			);
		}

		if (currentPassword === newPassword) {
			throw new BadRequestException('Yeni sifre mevcut sifre ile ayni olamaz');
		}

		await this.authService.changeUserPassword(
			userId,
			currentPassword,
			newPassword,
		);

		return { ok: true, message: 'Sifreniz guncellendi. Lutfen tekrar giris yapin.' };
	}
}
