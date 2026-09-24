import { Injectable } from '@nestjs/common';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket = 'entry-attachments';

  constructor() {
    const url = process.env.SUPABASE_URL;
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

  async upload(
    path: string,
    buffer: Buffer,
    contentType: string,
  ) {
    const { data, error } =
      await this.supabase.storage
        .from(this.bucket)
        .upload(path, buffer, {
          contentType,
          upsert: false,
        });

    if (error) {
      console.error(
        'Supabase upload error:',
        error,
      );

      throw error;
    }

    return data;
  }

  async createSignedUrl(
    path: string,
    expiresIn = 3600,
  ) {
    const { data, error } =
      await this.supabase.storage
        .from(this.bucket)
        .createSignedUrl(
          path,
          expiresIn,
        );

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }

  async remove(path: string) {
    const { error } =
      await this.supabase.storage
        .from(this.bucket)
        .remove([path]);

    if (error) {
      throw error;
    }
  }
}