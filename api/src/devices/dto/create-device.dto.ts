export class CreateDeviceDto {
  manufacturer?: string;
  model?: string;
  serialNumber?: string;

  purchaseDate?: string;
  installedAt?: string;
  warrantyUntil?: string;

  purchasePriceCents?: number;

  contractorName?: string;
}
