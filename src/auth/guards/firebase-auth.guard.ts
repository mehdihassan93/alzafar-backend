import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    Inject,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from '../../firebase/firebase.module';
import { UsersService } from '../../users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(
        @Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: admin.app.App,
        private readonly usersService: UsersService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const idToken = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(idToken);

            // Sync user with MongoDB if they don't exist
            let user = await this.usersService.findByFirebaseUid(decodedToken.uid);

            if (!user) {
                // Initial sync for first-time login
                user = await this.usersService.createFromFirebase({
                    firebaseUid: decodedToken.uid,
                    email: decodedToken.email || `firebase_${decodedToken.uid}@temporary.com`,
                    firstName: (decodedToken.name || 'User').split(' ')[0],
                    lastName: (decodedToken.name || '').split(' ').slice(1).join(' ') || ' ',
                });
            }

            request.user = {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                firebaseUid: user.firebaseUid,
            };

            return true;
        } catch (error) {
            console.error('Firebase Auth Error:', error);
            throw new UnauthorizedException('Invalid token');
        }
    }
}
