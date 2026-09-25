import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  createClient,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import { Request } from 'express';

export type AuthenticatedRequest =
  Request & {
    user: User;
  };

@Injectable()
export class SupabaseAuthGuard
  implements CanActivate
{
  private readonly supabase: SupabaseClient;

  constructor() {
    const supabaseUrl =
      process.env.SUPABASE_URL;

    const supabasePublishableKey =
      process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl) {
      throw new Error(
        'Brak SUPABASE_URL',
      );
    }

    if (!supabasePublishableKey) {
      throw new Error(
        'Brak SUPABASE_PUBLISHABLE_KEY',
      );
    }

    this.supabase = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const authorization =
      request.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException(
        'Brak tokenu użytkownika.',
      );
    }

    const token =
      authorization.substring(
        'Bearer '.length,
      );

    if (!token) {
      throw new UnauthorizedException(
        'Nieprawidłowy token.',
      );
    }

    const {
      data,
      error,
    } =
      await this.supabase.auth.getUser(
        token,
      );

    if (
      error ||
      !data.user
    ) {
      throw new UnauthorizedException(
        'Sesja wygasła lub token jest nieprawidłowy.',
      );
    }

    request.user = data.user;

    return true;
  }
}