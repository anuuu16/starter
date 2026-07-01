import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Card, DataTable } from '@org/ui';
import { useServerTable, type ServerTableParams } from '@org/hooks';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface GroupRow {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  _count?: { values: number };
}

interface GroupsResponse {
  groups: GroupRow[];
  total: number;
}

export function ConfigLookups() {
  const { t } = useTranslation();

  const fetchGroups = useCallback((p: ServerTableParams) => {
    const params = new URLSearchParams({
      page: String(p.page),
      limit: String(p.pageSize),
    });
    if (p.q) params.set('q', p.q);
    if (p.sort) {
      params.set('sort', p.sort.key);
      params.set('dir', p.sort.dir);
    }
    return apiGet<GroupsResponse>(`/lookups/admin/groups?${params.toString()}`).then(
      (r) => ({ rows: r.groups ?? [], total: r.total ?? 0 }),
    );
  }, []);

  const table = useServerTable<GroupRow>(fetchGroups, { pageSize: 20 });
  const { reload, error } = table;

  useEffect(() => {
    if (error) toast.error(t('config.lookups.loadError', 'Failed to load lookups'));
  }, [error, t]);

  const removeGroup = useCallback(
    async (id: string, name: string) => {
      if (
        !window.confirm(
          t(
            'config.lookups.deleteConfirm',
            'Delete "{{name}}" and all its values? This cannot be undone.',
            { name },
          ),
        )
      )
        return;
      try {
        await apiSend(`/lookups/${id}`, 'DELETE');
        toast.success(t('config.lookups.deleted', 'Group deleted'));
        reload();
      } catch {
        toast.error(t('config.lookups.deleteFailed', 'Failed to delete group'));
      }
    },
    [t, reload],
  );

  const columns = [
    {
      key: 'name',
      header: t('config.lookups.col.name', 'Name'),
      cell: (g: GroupRow) => (
        <Link
          to={`/config/lookups/${g.key}`}
          className="font-medium text-primary hover:underline"
        >
          {g.name}
        </Link>
      ),
      sortValue: (g: GroupRow) => g.name,
    },
    {
      key: 'key',
      header: t('config.lookups.col.key', 'Key'),
      cell: (g: GroupRow) => (
        <code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">{g.key}</code>
      ),
      sortValue: (g: GroupRow) => g.key,
    },
    {
      key: 'values',
      header: t('config.lookups.col.values', 'Values'),
      cell: (g: GroupRow) => (
        <span className="text-foreground/70">{g._count?.values ?? 0}</span>
      ),
    },
    {
      key: 'isPublic',
      header: t('config.lookups.col.visibility', 'Visibility'),
      cell: (g: GroupRow) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            g.isPublic
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {g.isPublic
            ? t('config.lookups.public', 'Public')
            : t('config.lookups.private', 'Private')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('config.lookups.col.actions', 'Actions'),
      pinned: 'right' as const,
      cell: (g: GroupRow) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" asChild>
            <Link to={`/config/lookups/${g.key}/edit`}>
              {t('common.edit', 'Edit')}
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:text-error"
            onClick={() => removeGroup(g.id, g.name)}
          >
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {t('config.lookups.title', 'Lookups')}
        </h2>
        <Button asChild size="sm">
          <Link to="/config/lookups/new">
            {t('config.lookups.new', 'New group')}
          </Link>
        </Button>
      </div>
      <Card className="rounded-xl p-6">
        <DataTable
          data={table.rows}
          columns={columns}
          rowKey={(g) => g.id}
          server={table.server}
          search={(g) => `${g.name} ${g.key}`}
          searchPlaceholder={t('config.lookups.search', 'Search groups…')}
          tableId="config-lookups"
          empty={
            <p className="text-foreground/60">
              {t('config.lookups.empty', 'No lookup groups yet. Create one to get started.')}
            </p>
          }
        />
      </Card>
    </div>
  );
}

export default ConfigLookups;
