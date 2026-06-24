import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';

export class UserService {
  private userRepo = new UserRepository();

  async createZoneAdmin(data: {
    fullName: string;
    email: string;
    password?: string;
    assignedZoneId: string;
  }) {
    if (!data.fullName || !data.email || !data.password || data.password.length < 6 || !data.assignedZoneId) {
      throw new Error('fullName, email, password, and assignedZoneId are required');
    }

    const zone = await this.userRepo.getZoneByIdAndActive(data.assignedZoneId);
    if (!zone) {
      throw new Error('Assigned zone is invalid');
    }

    const passHash = await bcrypt.hash(data.password, 10);
    const insertId = await this.userRepo.insertUser({
      email: data.email,
      passHash,
      fullName: data.fullName,
      role: 'ADMIN',
      assignedZoneId: data.assignedZoneId,
    });

    const user = await this.userRepo.getUserDetails(insertId);
    if (!user) {
      throw new Error('Failed to retrieve newly created user');
    }

    return {
      user,
      mapped: {
        id: String(user.id),
        email: user.email,
        displayName: user.full_name,
        role: user.role,
        assignedZoneId: user.assigned_zone_id == null ? null : String(user.assigned_zone_id),
        assignedZoneName: user.zone_name,
        status: user.status,
        createdAt: user.created_at,
      },
    };
  }
}
