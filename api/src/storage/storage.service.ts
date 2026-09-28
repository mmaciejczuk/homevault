import { Injectable } from '@nestjs/common';

import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly supabase: SupabaseClient;

  private readonly bucket =
    'entry-attachments';

  constructor() {
    const url =
      process.env.SUPABASE_URL;

    const secretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!url) {
      throw new Error(
        'SUPABASE_URL is not configured',
      );
    }

    if (!secretKey) {
      throw new Error(
        'SUPABASE_SECRET_KEY is not configured',
      );
    }

    this.supabase = createClient(
      url,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  private getStatus(
    error: unknown,
  ): number | undefined {
    if (
      !error ||
      typeof error !== 'object'
    ) {
      return undefined;
    }

    const candidate =
      error as {
        status?: number | string;
        statusCode?: number | string;
      };

    const rawStatus =
      candidate.statusCode ??
      candidate.status;

    if (
      rawStatus === undefined
    ) {
      return undefined;
    }

    const status =
      Number(rawStatus);

    return Number.isFinite(status)
      ? status
      : undefined;
  }

  private isRetryable(
    error: unknown,
  ) {
    const status =
      this.getStatus(error);

    return [
      408,
      429,
      500,
      502,
      503,
      504,
    ].includes(
      status ?? 0,
    );
  }

  private wait(
    milliseconds: number,
  ) {
    return new Promise<void>(
      (resolve) => {
        setTimeout(
          resolve,
          milliseconds,
        );
      },
    );
  }

  async upload(
    path: string,
    buffer: Buffer,
    contentType: string,
  ) {
    const maxAttempts = 4;

    let hadRetryableError =
      false;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt += 1
    ) {
      const {
        data,
        error,
      } =
        await this.supabase.storage
          .from(this.bucket)
          .upload(
            path,
            buffer,
            {
              contentType,
              upsert: false,
            },
          );

      if (!error) {
        return data;
      }

      const status =
        this.getStatus(error);

      /*
       * Szczególny przypadek:
       *
       * poprzednia próba dostała np. 504,
       * ale sam upload mógł zostać wykonany.
       *
       * Ponowienie tego samego UUID wtedy
       * może zwrócić 409 "already exists".
       * W takim przypadku traktujemy upload
       * jako wykonany.
       */
      if (
        status === 409 &&
        hadRetryableError
      ) {
        console.warn(
          `Storage upload ${path}: plik już istnieje po ponowieniu requestu.`,
        );

        return {
          path,
        };
      }

      console.error(
        `Supabase upload error, attempt ${attempt}/${maxAttempts}:`,
        error,
      );

      if (
        !this.isRetryable(
          error,
        ) ||
        attempt ===
          maxAttempts
      ) {
        throw error;
      }

      hadRetryableError =
        true;

      const delay =
        500 *
        2 ** (attempt - 1);

      console.warn(
        `Ponawiam upload za ${delay} ms...`,
      );

      await this.wait(
        delay,
      );
    }

    throw new Error(
      'Storage upload failed',
    );
  }

  async createSignedUrl(
    path: string,
    expiresIn = 3600,
  ) {
    const maxAttempts = 3;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt += 1
    ) {
      const {
        data,
        error,
      } =
        await this.supabase.storage
          .from(this.bucket)
          .createSignedUrl(
            path,
            expiresIn,
          );

      if (!error) {
        return data.signedUrl;
      }

      console.error(
        `Supabase signed URL error, attempt ${attempt}/${maxAttempts}:`,
        error,
      );

      if (
        !this.isRetryable(
          error,
        ) ||
        attempt ===
          maxAttempts
      ) {
        throw error;
      }

      await this.wait(
        300 *
          2 ** (attempt - 1),
      );
    }

    throw new Error(
      'Could not create signed URL',
    );
  }

  async remove(
    path: string,
  ) {
    const maxAttempts = 3;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt += 1
    ) {
      const {
        error,
      } =
        await this.supabase.storage
          .from(this.bucket)
          .remove([
            path,
          ]);

      if (!error) {
        return;
      }

      console.error(
        `Supabase remove error, attempt ${attempt}/${maxAttempts}:`,
        error,
      );

      if (
        !this.isRetryable(
          error,
        ) ||
        attempt ===
          maxAttempts
      ) {
        throw error;
      }

      await this.wait(
        300 *
          2 ** (attempt - 1),
      );
    }
  }
}