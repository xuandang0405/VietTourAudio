import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ok } from '../types/api.types';

export class UserController {
  private userService = new UserService();

  createZoneAdmin = async (req: Request, res: Response): Promise<void> => {
    // [UC02] Authenticate User - User management setup
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const assignedZoneId = req.body.assignedZoneId == null ? '' : String(req.body.assignedZoneId);

    try {
      const { user, mapped } = await this.userService.createZoneAdmin({
        fullName,
        email,
        password,
        assignedZoneId,
      });

      req.auditMeta = {
        action: 'CREATE_ZONE_ADMIN',
        targetType: 'users',
        targetId: BigInt(user.id),
        beforeData: null,
        afterData: user,
      };

      res.json(ok(mapped));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
