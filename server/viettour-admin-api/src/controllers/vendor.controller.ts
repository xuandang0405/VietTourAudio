import { Request, Response } from 'express';
import { z } from 'zod';
import { VendorService } from '../services/vendor.service';
import { ok } from '../types/api.types';
import { optionalReason, requireReason, toBigIntId } from '../utils/serialization';

const createVendorSchema = z.object({
  tradeName: z.string().min(1),
  contactEmail: z.string().email(),
  password: z.string().min(6),
  vendorCode: z.string().min(1),
  assignedTourId: z.union([z.number(), z.string()]).nullable().optional(),
});

const updateVendorSchema = z.object({
  legalName: z.string().min(1).optional(),
  tradeName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  vendorCode: z.string().min(1).optional(),
  assignedTourId: z.union([z.number(), z.string()]).nullable().optional(),
});

export class VendorController {
  private vendorService = new VendorService();

  getVendors = async (req: Request, res: Response): Promise<void> => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'ALL';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const list = await this.vendorService.getVendors(status, search);
    res.json(ok(list));
  };

  getToursList = async (req: Request, res: Response): Promise<void> => {
    const tours = await this.vendorService.getToursList();
    res.json(ok(tours));
  };

  createVendor = async (req: Request, res: Response): Promise<void> => {
    const parsed = createVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.format() });
      return;
    }

    try {
      const { vendorId, row, mapped } = await this.vendorService.createVendor({
        tradeName: parsed.data.tradeName,
        contactEmail: parsed.data.contactEmail,
        password: parsed.data.password,
        vendorCode: parsed.data.vendorCode,
        assignedTourId: parsed.data.assignedTourId ? String(parsed.data.assignedTourId) : null,
      });

      req.auditMeta = {
        action: 'CREATE_VENDOR_ACCOUNT',
        targetType: 'vendors',
        targetId: vendorId,
        beforeData: null,
        afterData: row,
      };

      res.json(ok(mapped));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  getVendorDetail = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const detail = await this.vendorService.getVendorDetail(id);

    if (!detail) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    res.json(ok(detail));
  };

  approveVendor = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const userId = req.user!.userId;

    try {
      const { before, after, mappedAfter } = await this.vendorService.approveVendor(id, userId);

      req.auditMeta = {
        action: 'APPROVE_VENDOR',
        targetType: 'vendors',
        targetId: id,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(mappedAfter));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  rejectVendor = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const reason = optionalReason(req.body.reason);

    try {
      const { before, after, mappedAfter } = await this.vendorService.rejectVendor(id, reason);

      req.auditMeta = {
        action: 'REJECT_VENDOR',
        targetType: 'vendors',
        targetId: id,
        reason,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(mappedAfter));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  suspendVendor = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const reason = requireReason(req.body.reason);

    try {
      const { before, after, mappedAfter } = await this.vendorService.suspendVendor(id, reason);

      req.auditMeta = {
        action: 'SUSPEND_VENDOR',
        targetType: 'vendors',
        targetId: id,
        reason,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(mappedAfter));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  unsuspendVendor = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'vendor id');

    try {
      const { before, after, mappedAfter } = await this.vendorService.unsuspendVendor(id);

      req.auditMeta = {
        action: 'UNSUSPEND_VENDOR',
        targetType: 'vendors',
        targetId: id,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(mappedAfter));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  forceCancelVendor = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const reason = requireReason(req.body.reason);

    try {
      const { before, after, mappedAfter } = await this.vendorService.forceCancelVendor(id, reason);

      req.auditMeta = {
        action: 'FORCE_CANCEL_VENDOR',
        targetType: 'vendors',
        targetId: id,
        reason,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(mappedAfter));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  updateVendorStatus = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const status = typeof req.body.status === 'string' ? req.body.status : '';
    const reason = typeof req.body.reason === 'string' ? req.body.reason : '';

    if (!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status value' });
      return;
    }

    try {
      const { before, after, mappedAfter } = await this.vendorService.updateVendorStatus(id, status, reason, req.user ? BigInt(req.user.userId) : undefined);

      req.auditMeta = {
        action: 'UPDATE_VENDOR_STATUS',
        targetType: 'vendors',
        targetId: id,
        reason: reason || undefined,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(mappedAfter));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  updateVendor = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const parsed = updateVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.format() });
      return;
    }

    try {
      const { before, after, mappedAfter } = await this.vendorService.updateVendor(id, {
        legalName: parsed.data.legalName,
        tradeName: parsed.data.tradeName,
        contactEmail: parsed.data.contactEmail,
        vendorCode: parsed.data.vendorCode,
        assignedTourId: parsed.data.assignedTourId ? String(parsed.data.assignedTourId) : (parsed.data.assignedTourId === null ? null : undefined),
      });

      req.auditMeta = {
        action: 'UPDATE_VENDOR_ACCOUNT',
        targetType: 'vendors',
        targetId: id,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(mappedAfter));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
