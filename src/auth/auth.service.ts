import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import * as nodemailer from 'nodemailer';
import { User } from '../database/entities/user.entity';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private passwordResetTokens = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    this.googleClient = new OAuth2Client(googleClientId);
  }

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
      password: this.hashPassword(password),
      isCompany: false,
    });

    const saved = await this.userRepository.save(created);

    return {
      access_token: this.createToken(),
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
    const passwordMatches = user
      ? user.password.includes(':')
        ? this.verifyPassword(user.password, password)
        : user.password === password
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('E-posta veya sifre hatali');
    }

    if (!user.password.includes(':')) {
      user.password = this.hashPassword(password);
      await this.userRepository.save(user);
    }

    return {
      access_token: this.createToken(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async googleAuth(input: { token: string }) {
    const token = input.token?.trim();

    if (!token) {
      throw new BadRequestException('Google token zorunludur');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID || '',
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Geçersiz Google token');
      }

      const email = payload.email?.toLowerCase().trim();
      const name = payload.name || payload.email || 'Google User';

      if (!email) {
        throw new UnauthorizedException('Google hesabında e-posta bulunamadi');
      }

      let user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        user = this.userRepository.create({
          name,
          email,
          password: '', // No password for Google auth
          isCompany: false,
        });
        user = await this.userRepository.save(user);
      }

      return {
        access_token: this.createToken(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('Google auth verification failed:', error);
      throw new UnauthorizedException('Google kimlik dogrulama basarisiz');
    }
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  private verifyPassword(storedPassword: string, password: string): boolean {
    const [salt, key] = storedPassword.split(':');
    if (!salt || !key) {
      return false;
    }

    const derivedKey = scryptSync(password, salt, 64);
    const storedKey = Buffer.from(key, 'hex');
    return timingSafeEqual(derivedKey, storedKey);
  }

  private createToken(): string {
    return randomBytes(32).toString('hex');
  }

  async forgotPassword(input: { email: string }) {
    const email = input.email?.trim().toLowerCase();

    if (!email) {
      throw new BadRequestException('E-posta adresi zorunludur');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return { message: 'Sifre sifirlama baglantisi e-posta adresinize gonderildi' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000; // 1 hour

    this.passwordResetTokens.set(resetToken, { userId: user.id, expiresAt });

    // Send email (simplified - in production, use actual SMTP)
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
          from: process.env.FROM_EMAIL || 'noreply@neareastway.com',
          to: email,
          subject: 'Sifre Sifirlama - Near East Way',
          html: `
            <p>Merhaba ${user.name},</p>
            <p>Sifrenizi sifirlamak icin asagidaki baglantiya tiklayin:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Bu baglanti 1 saat sonra gecersiz olacaktir.</p>
          `,
        });
      } catch (error) {
        console.error('Failed to send password reset email:', error);
      }
    }

    return { message: 'Sifre sifirlama baglantisi e-posta adresinize gonderildi' };
  }

  async resetPassword(input: { token: string; password: string }) {
    const { token, password } = input;

    if (!token || !password) {
      throw new BadRequestException('Token ve sifre zorunludur');
    }

    if (password.length < 6) {
      throw new BadRequestException('Sifre en az 6 karakter olmalidir');
    }

    const resetData = this.passwordResetTokens.get(token);
    if (!resetData || resetData.expiresAt < Date.now()) {
      throw new BadRequestException('Gecersiz veya suresi dolmus token');
    }

    const user = await this.userRepository.findOne({ where: { id: resetData.userId } });
    if (!user) {
      throw new BadRequestException('Kullanici bulunamadi');
    }

    user.password = this.hashPassword(password);
    await this.userRepository.save(user);

    // Remove used token
    this.passwordResetTokens.delete(token);

    return { message: 'Sifreniz basariyla guncellendi' };
  }
}
