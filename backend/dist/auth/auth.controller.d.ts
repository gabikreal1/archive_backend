import { AuthService } from './auth.service';
declare class LoginDto {
    email: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        userId: string;
    }>;
    getCircleAuthUrl(state?: string): {
        url: string;
        state: string;
    };
}
export {};
