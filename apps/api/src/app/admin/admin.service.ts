import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@org/utils';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  private async assertNotLastAdmin(userId: string) {
    const target = await this.db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (target?.role !== Role.ADMIN) return;
    const adminCount = await this.db.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) {
      throw new BadRequestException(
        'Cannot remove the last admin from the system',
      );
    }
  }

  async getUsers(
    page = 1,
    limit = 20,
    q?: string,
    sort?: string,
    dir: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;

    // Case-insensitive contains search across the human-facing identifiers.
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { username: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Allow-list sortable columns so the query param can't reach arbitrary fields.
    const SORTABLE = ['name', 'email', 'username', 'role', 'createdAt'] as const;
    const sortField = (SORTABLE as readonly string[]).includes(sort ?? '')
      ? (sort as (typeof SORTABLE)[number])
      : 'createdAt';

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: dir },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          provider: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      this.db.user.count({ where }),
    ]);
    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateUserRole(userId: string, role: Role) {
    if (role !== Role.ADMIN) await this.assertNotLastAdmin(userId);
    return this.db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async deleteUser(userId: string) {
    await this.assertNotLastAdmin(userId);
    await this.db.user.delete({ where: { id: userId } });
    return { message: 'User deleted' };
  }

  async getPlans() {
    return this.db.plan.findMany({
      include: { features: true },
      orderBy: { price: 'asc' },
    });
  }

  async getStats() {
    const [userCount, paymentCount, activeWallets] = await Promise.all([
      this.db.user.count(),
      this.db.payment.count({ where: { status: 'completed' } }),
      this.db.userWallet.count({ where: { active: true } }),
    ]);
    return { userCount, paymentCount, activeWallets };
  }

  async getLookups() {
    return this.db.lookupGroup.findMany({
      include: { values: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }
}
