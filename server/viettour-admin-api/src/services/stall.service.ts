import { StallRepository } from '../repositories/stall.repository';
import { buildStallZoneScope } from '../utils/zoneScope';

function generateAlphanumericCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class StallService {
  private stallRepo = new StallRepository();

  async resetStallQr(id: bigint, req: any) {
    const zoneScope = buildStallZoneScope(req);
    const stall = await this.stallRepo.getStallById(id, zoneScope.clause, zoneScope.params);
    if (!stall) {
      throw new Error('Stall not found');
    }

    const newCode = generateAlphanumericCode(8);
    await this.stallRepo.updateStallZoneCode(id, newCode);
    return newCode;
  }

  async createStall(data: {
    vendorId: number | string;
    name: string;
    slug: string;
    description?: string | null;
    address?: string | null;
    latitude?: number;
    longitude?: number;
    activationRadius?: number;
    openingHours?: string | null;
    isFeatured?: boolean;
    isPremium?: boolean;
    priorityScore?: number;
    status?: string;
    zoneCode?: string | null;
  }) {
    return this.stallRepo.insertStall(data);
  }
}
