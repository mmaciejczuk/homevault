export type ServiceType =
  'INSTALLATION' | 'INSPECTION' | 'REPAIR' | 'MAINTENANCE' | 'OTHER';

export class CreateServiceRecordDto {
  type!: ServiceType;

  serviceDate!: string;

  description?: string;

  contractorName?: string;

  costCents?: number;

  nextServiceDate?: string;
}
