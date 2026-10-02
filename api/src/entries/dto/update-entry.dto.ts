import type {
  EntryCategory,
} from './create-entry.dto';

export class UpdateEntryDto {
  title?: string;
  description?: string | null;
  category?: EntryCategory;
}