export type EntryCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HEATING'
  | 'WALL'
  | 'FLOOR'
  | 'DEVICE'
  | 'NOTE'
  | 'OTHER';

export class CreateEntryDto {
  title!: string;
  description?: string;
  category!: EntryCategory;
}