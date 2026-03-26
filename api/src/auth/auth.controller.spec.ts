import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: () => 'test-token' },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config = { 'admin.username': 'admin', 'admin.password': 'secret' };
              return config[key];
            },
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('should return a JWT token on valid credentials', async () => {
    const result = await controller.login({ username: 'admin', password: 'secret' });
    expect(result).toEqual({ access_token: 'test-token' });
  });

  it('should throw UnauthorizedException on invalid credentials', async () => {
    await expect(controller.login({ username: 'admin', password: 'wrong' }))
      .rejects.toThrow(UnauthorizedException);
  });
});
