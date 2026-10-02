import type { ServiceType } from './create-service-record.dto';

export class UpdateServiceRecordDto {
  type?: ServiceType;

  serviceDate?: string;

  description?: string | null;

  contractorName?: string | null;

  costCents?: number | null;

  nextServiceDate?: string | null;
}
