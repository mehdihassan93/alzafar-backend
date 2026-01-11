import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

@Global()
@Module({
    providers: [
        {
            provide: FIREBASE_ADMIN,
            useFactory: (configService: ConfigService) => {
                let privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');
                if (privateKey) {
                    privateKey = privateKey.trim();
                    if (privateKey.startsWith("'") || privateKey.startsWith('"')) {
                        privateKey = privateKey.substring(1, privateKey.length - 1);
                    }
                }

                if (!admin.apps.length) {
                    return admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
                            clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
                            privateKey: privateKey,
                        }),
                    });
                }
                return admin.app();
            },
            inject: [ConfigService],
        },
    ],
    exports: [FIREBASE_ADMIN],
})
export class FirebaseModule { }
