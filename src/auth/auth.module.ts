import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    FirebaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') as any },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, FirebaseAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, FirebaseAuthGuard, UsersModule],
})
export class AuthModule { }
