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
}
