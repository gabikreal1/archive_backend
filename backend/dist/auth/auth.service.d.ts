import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
interface LoginPayload {
    userId: string;
}
export declare class AuthService {
    private readonly configService;
    private readonly jwtService;
    constructor(configService: ConfigService, jwtService: JwtService);
    loginWithEmail(email: string): Promise<{
        accessToken: string;
        userId: string;
    }>;
    verifyToken(token: string): Promise<LoginPayload>;
    private getJwtSecret;
    private getJwtExpiresIn;
    getCircleAuthUrl(providedState?: string): {
        url: string;
        state: string;
    };
}
export {};
