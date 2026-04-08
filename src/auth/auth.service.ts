import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(input: { name: string; email: string; password: string }) {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    const password = input.password?.trim();

    if (!name || !email || !password) {
      throw new BadRequestException('Tum alanlar zorunludur');
    }

    if (password.length < 6) {
      throw new BadRequestException('Sifre en az 6 karakter olmalidir');
    }

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Bu e-posta ile kayitli kullanici var');
    }

    const created = this.userRepository.create({
      name,
      email,
      password,
      isCompany: false,
    });

    const saved = await this.userRepository.save(created);

    return {
      access_token: this.createToken(saved.id, saved.email),
      user: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
      },
    };
  }

  async login(input: { email: string; password: string }) {
    const email = input.email?.trim().toLowerCase();
    const password = input.password?.trim();

    if (!email || !password) {
      throw new BadRequestException('E-posta ve sifre zorunludur');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || user.password !== password) {
      throw new UnauthorizedException('E-posta veya sifre hatali');
    }

    return {
      access_token: this.createToken(user.id, user.email),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  private createToken(userId: string, email: string): string {
    const payload = `${userId}:${email}:${Date.now()}`;
    return Buffer.from(payload, 'utf8').toString('base64url');
  }
}
