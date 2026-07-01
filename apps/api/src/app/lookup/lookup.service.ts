import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LookupService {
  constructor(private readonly db: DatabaseService) {}

  /** Get all public lookup groups with their values */
  async getAllPublic() {
    return this.db.lookupGroup.findMany({
      where: { isPublic: true },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Get a single lookup group by key */
  async getByKey(key: string) {
    const group = await this.db.lookupGroup.findUnique({
      where: { key },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException(`Lookup group "${key}" not found`);
    return group;
  }

  /** Admin: get all groups (including non-public) */
  async getAll() {
    return this.db.lookupGroup.findMany({
      include: { values: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  /** Admin: paginated + searchable + sortable group list (with value counts). */
  async getGroupsPaginated(
    page = 1,
    limit = 20,
    q?: string,
    sort?: string,
    dir: 'asc' | 'desc' = 'asc',
  ) {
    const skip = (page - 1) * limit;
    const where = q
      ? {
          OR: [
            { key: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const SORTABLE = ['key', 'name'] as const;
    const sortField = (SORTABLE as readonly string[]).includes(sort ?? '')
      ? (sort as (typeof SORTABLE)[number])
      : 'name';

    const [groups, total] = await Promise.all([
      this.db.lookupGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: dir },
        include: { _count: { select: { values: true } } },
      }),
      this.db.lookupGroup.count({ where }),
    ]);
    return { groups, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** Admin: get one group by key including inactive values (for editing). */
  async getGroupAdmin(key: string) {
    const group = await this.db.lookupGroup.findUnique({
      where: { key },
      include: { values: { orderBy: { order: 'asc' } } },
    });
    if (!group) throw new NotFoundException(`Lookup group "${key}" not found`);
    return group;
  }

  /** Admin: update a group's metadata. */
  async updateGroup(
    id: string,
    data: { name?: string; description?: string; isPublic?: boolean },
  ) {
    return this.db.lookupGroup.update({ where: { id }, data });
  }

  /** Admin: delete a group and all its values. */
  async deleteGroup(id: string) {
    await this.db.lookupValue.deleteMany({ where: { groupId: id } });
    await this.db.lookupGroup.delete({ where: { id } });
    return { message: 'Group deleted' };
  }

  /** Admin: create a new lookup group */
  async createGroup(data: {
    key: string;
    name: string;
    description?: string;
    isPublic?: boolean;
  }) {
    return this.db.lookupGroup.create({ data });
  }

  /** Admin: add a value to a group */
  async addValue(
    groupId: string,
    data: { label: string; value: string; order?: number },
  ) {
    return this.db.lookupValue.create({
      data: { ...data, groupId },
    });
  }

  /** Admin: update a value */
  async updateValue(
    id: string,
    data: {
      label?: string;
      value?: string;
      order?: number;
      isActive?: boolean;
    },
  ) {
    return this.db.lookupValue.update({ where: { id }, data });
  }

  /** Admin: delete a value */
  async deleteValue(id: string) {
    await this.db.lookupValue.delete({ where: { id } });
    return { message: 'Value deleted' };
  }
}
