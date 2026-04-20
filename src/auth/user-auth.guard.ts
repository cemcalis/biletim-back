import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

type AuthenticatedRequest = Request & {
  user?: { userId: string; email: string };
};

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Gecerli bir erisim token gerekli');
    }

    const token = authHeader.slice(7).trim();
    const session = this.authService.validateAccessToken(token);

    if (!session) {
      throw new UnauthorizedException('Token gecersiz veya suresi dolmus');
    }

    request.user = session;
    return true;
  }
}
