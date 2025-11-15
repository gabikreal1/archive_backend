import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader =
      request.headers['authorization'] ?? request.headers['Authorization'];
    if (!authHeader || Array.isArray(authHeader)) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    try {
      const payload = await this.authService.verifyToken(token);
      (request as any).user = { userId: payload.userId };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
