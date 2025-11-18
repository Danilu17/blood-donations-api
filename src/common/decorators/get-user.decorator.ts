import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
