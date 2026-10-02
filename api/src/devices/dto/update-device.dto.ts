export class UpdateDeviceDto {
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;

  purchaseDate?: string | null;
  installedAt?: string | null;
  warrantyUntil?: string | null;

  purchasePriceCents?: number | null;

  contractorName?: string | null;
}
