import { ContentRepository } from '../repositories/content.repository';

function mapMedia(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    stallId: row.stall_id == null ? null : String(row.stall_id),
    poiId: row.poi_id == null ? null : String(row.poi_id),
    mediaType: row.file_type === 'LOGO' || row.file_type === 'QR' ? 'IMAGE' : row.file_type,
    storagePath: row.file_path,
    publicUrl: row.public_url || row.file_path,
    mimeType: row.mime_type,
    sizeBytes: row.file_size,
    moderationStatus: row.moderation_status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    vendor: row.trade_name ? { businessName: row.trade_name } : null,
    stall: row.stall_name ? { name: row.stall_name } : null,
    poi: row.poi_name ? { name: row.poi_name } : null,
  };
}

export class ContentService {
  private contentRepo = new ContentRepository();

  async getMediaQueue(status: string) {
    const rows = await this.contentRepo.getMediaQueue(status);
    return rows.map(mapMedia);
  }

  async getMedia(id: bigint) {
    const row = await this.contentRepo.getMediaById(id);
    return row ? mapMedia(row) : null;
  }

  async approveMedia(id: bigint, actorId: bigint) {
    const item = await this.getMedia(id);
    if (!item) {
      throw new Error('Media file not found');
    }

    await this.contentRepo.updateModeration(id, 'APPROVED', actorId);
    const result = await this.getMedia(id);
    return { item, result };
  }

  async rejectMedia(id: bigint, reason: string | null, actorId: bigint) {
    const item = await this.getMedia(id);
    if (!item) {
      throw new Error('Media file not found');
    }

    await this.contentRepo.updateModeration(id, 'REJECTED', actorId, reason);
    const result = await this.getMedia(id);
    return { item, result };
  }

  async hideMedia(id: bigint, reason: string, actorId: bigint) {
    const item = await this.getMedia(id);
    if (!item) {
      throw new Error('Media file not found');
    }

    await this.contentRepo.updateModeration(id, 'HIDDEN', actorId, reason);
    const result = await this.getMedia(id);
    return { item, result };
  }

  async bulkApprove(ids: string[], actorId: bigint) {
    if (!ids.length) {
      throw new Error('ids are required');
    }

    await this.contentRepo.bulkApprove(ids, actorId);
    return ids.length;
  }
}
