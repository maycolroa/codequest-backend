import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Profile } from '../entities/profile.entity';

export const GetUser = createParamDecorator(
  (
    data: keyof Profile | undefined,
    context: ExecutionContext,
  ): Profile | Profile[keyof Profile] => {
    const request = context.switchToHttp().getRequest<{ user: Profile }>();
    return data ? request.user[data] : request.user;
  },
);
