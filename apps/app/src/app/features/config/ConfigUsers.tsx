import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DataTable } from '@org/ui';
import { useServerTable, type ServerTableParams } from '@org/hooks';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface UserRow {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  provider: string;
  emailVerified: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
}

export function ConfigUsers() {
  const { t } = useTranslation();

  const fetchUsers = useCallback((p: ServerTableParams) => {
    const params = new URLSearchParams({
      page: String(p.page),
      limit: String(p.pageSize),
    });
    if (p.q) params.set('q', p.q);
    if (p.sort) {
      params.set('sort', p.sort.key);
      params.set('dir', p.sort.dir);
    }
    return apiGet<UsersResponse>(`/admin/users?${params.toString()}`).then((r) => ({
      rows: r.users ?? [],
      total: r.total ?? 0,
    }));
  }, []);

  const table = useServerTable<UserRow>(fetchUsers, { pageSize: 20 });
  const { reload, error } = table;

  useEffect(() => {
    if (error) toast.error(t('config.users.loadError', 'Failed to load users'));
  }, [error, t]);

  const toggleRole = useCallback(
    async (id: string, role: string) => {
      const next = role === 'admin' ? 'user' : 'admin';
      try {
        await apiSend(`/admin/users/${id}/role`, 'PATCH', { role: next });
        toast.success(
          t('config.users.roleUpdated', 'Role updated to {{role}}', { role: next }),
        );
        reload();
      } catch {
        toast.error(t('config.users.roleFailed', 'Failed to update role'));
      }
    },
    [t, reload],
  );

  const removeUser = useCallback(
    async (id: string, name: string) => {
      if (
        !window.confirm(
          t('config.users.deleteConfirm', 'Delete {{name}}? This cannot be undone.', {
            name,
          }),
        )
      )
        return;
      try {
        await apiSend(`/admin/users/${id}`, 'DELETE');
        toast.success(t('config.users.deleted', 'User deleted'));
        reload();
      } catch {
        toast.error(t('config.users.deleteFailed', 'Failed to delete user'));
      }
    },
    [t, reload],
  );

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('config.users.col.name', 'Name'),
        cell: (u: UserRow) => <span className="font-medium">{u.name}</span>,
        sortValue: (u: UserRow) => u.name,
      },
      {
        key: 'email',
        header: t('config.users.col.email', 'Email'),
        cell: (u: UserRow) => <span className="text-foreground/70">{u.email}</span>,
        sortValue: (u: UserRow) => u.email,
      },
      {
        key: 'provider',
        header: t('config.users.col.provider', 'Provider'),
        cell: (u: UserRow) => (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
            {u.provider}
          </span>
        ),
      },
      {
        key: 'role',
        header: t('config.users.col.role', 'Role'),
        cell: (u: UserRow) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              u.role === 'admin'
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {u.role}
          </span>
        ),
        sortValue: (u: UserRow) => u.role,
      },
      {
        key: 'actions',
        header: t('config.users.col.actions', 'Actions'),
        pinned: 'right' as const,
        cell: (u: UserRow) => (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => toggleRole(u.id, u.role)}>
              {u.role === 'admin'
                ? t('config.users.demote', 'Demote')
                : t('config.users.promote', 'Promote')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-error hover:text-error"
              onClick={() => removeUser(u.id, u.name)}
            >
              {t('common.delete', 'Delete')}
            </Button>
          </div>
        ),
      },
    ],
    [t, toggleRole, removeUser],
  );

  return (
    <Card className="rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {t('config.users.title', 'Users')}
      </h2>
      <DataTable
        data={table.rows}
        columns={columns}
        rowKey={(u) => u.id}
        server={table.server}
        search={(u) => `${u.name} ${u.email} ${u.username}`}
        searchPlaceholder={t('config.users.search', 'Search users…')}
        tableId="config-users"
      />
    </Card>
  );
}

export default ConfigUsers;
