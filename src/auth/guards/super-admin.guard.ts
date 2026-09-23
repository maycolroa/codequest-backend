import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { Profile } from '../entities/profile.entity';

type AuthenticatedRequest = Request & { user: Profile };

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user?.isSuperAdmin) {
      throw new ForbiddenException('Se requiere una cuenta superadmin');
    }

    return true;
  }
}