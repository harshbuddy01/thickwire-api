import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalCustomerJwtGuard extends AuthGuard('customer-jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any) {
        // Return user if authenticated, null if not — never throw 401
        return user || null;
    }
}
