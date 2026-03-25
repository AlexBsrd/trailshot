import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ access_token: string }> {
    const validUser = this.config.get('admin.username');
    const validPass = this.config.get('admin.password');

    if (username !== validUser || password !== validPass) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({ sub: 'admin', role: 'admin' });
    return { access_token: token };
  }
}
