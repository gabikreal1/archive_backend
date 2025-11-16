import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../circle/wallet/wallet.service';
interface LoginPayload {
    userId: string;
}
export declare class AuthService {
    private readonly configService;
    private readonly jwtService;
    private readonly walletService;
    constructor(configService: ConfigService, jwtService: JwtService, walletService: WalletService);
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
