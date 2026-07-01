import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { createLookupValueSchema, type CreateLookupValueDto } from '@org/dto';
import {
  Button,
  Card,
  DataTable,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from '@org/ui';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface ValueRow {
  id: string;
  label: string;
  value: string;
  order: number;
  isActive: boolean;
}

interface GroupDetail {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  values: ValueRow[];
}

export function ConfigLookupDetail() {
  const { t } = useTranslation();
  const { key } = useParams<{ key: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ValueRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(() => {
    if (!key) return;
    setLoading(true);
    apiGet<GroupDetail>(`/lookups/admin/group/${key}`)
      .then(setGroup)
      .catch(() => toast.error(t('config.lookups.groupLoadError', 'Failed to load group')))
      .finally(() => setLoading(false));
  }, [key, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (v: ValueRow) => {
    setEditing(v);
    setDialogOpen(true);
  };

  const toggleActive = useCallback(
    async (v: ValueRow) => {
      try {
        await apiSend(`/lookups/values/${v.id}`, 'PATCH', { isActive: !v.isActive });
        load();
      } catch {
        toast.error(t('config.lookups.value.saveFailed', 'Failed to update value'));
      }
    },
    [load, t],
  );

  const removeValue = useCallback(
    async (v: ValueRow) => {
      if (
        !window.confirm(
          t('config.lookups.value.deleteConfirm', 'Delete value "{{label}}"?', {
            label: v.label,
          }),
        )
      )
        return;
      try {
        await apiSend(`/lookups/values/${v.id}`, 'DELETE');
        toast.success(t('config.lookups.value.deleted', 'Value deleted'));
        load();
      } catch {
        toast.error(t('config.lookups.value.deleteFailed', 'Failed to delete value'));
      }
    },
    [load, t],
  );

  if (loading)
    return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;
  if (!group)
    return (
      <p className="text-foreground/60">{t('config.lookups.notFound', 'Group not found')}</p>
    );

  const columns = [
    {
      key: 'label',
      header: t('config.lookups.value.label', 'Label'),
      cell: (v: ValueRow) => <span className="font-medium">{v.label}</span>,
      sortValue: (v: ValueRow) => v.label,
    },
    {
      key: 'value',
      header: t('config.lookups.value.value', 'Value'),
      cell: (v: ValueRow) => (
        <code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">{v.value}</code>
      ),
      sortValue: (v: ValueRow) => v.value,
    },
    {
      key: 'order',
      header: t('config.lookups.value.order', 'Order'),
      cell: (v: ValueRow) => <span className="text-foreground/70">{v.order}</span>,
      sortValue: (v: ValueRow) => v.order,
    },
    {
      key: 'isActive',
      header: t('config.lookups.value.active', 'Active'),
      cell: (v: ValueRow) => (
        <button
          type="button"
          onClick={() => toggleActive(v)}
          className={`text-xs px-2 py-0.5 rounded-full ${
            v.isActive
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {v.isActive ? t('common.yes', 'Yes') : t('common.no', 'No')}
        </button>
      ),
    },
    {
      key: 'actions',
      header: t('config.lookups.col.actions', 'Actions'),
      pinned: 'right' as const,
      cell: (v: ValueRow) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
            {t('common.edit', 'Edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:text-error"
            onClick={() => removeValue(v)}
          >
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Link to="/config/lookups" className="text-sm text-primary hover:underline">
        ← {t('config.lookups.title', 'Lookups')}
      </Link>

      <Card className="rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{group.name}</h2>
            <p className="mt-1 text-sm text-foreground/60">
              <code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">
                {group.key}
              </code>{' '}
              {group.description}
            </p>
          </div>
          <Button size="sm" variant="ghost" asChild>
            <Link to={`/config/lookups/${group.key}/edit`}>
              {t('common.edit', 'Edit')}
            </Link>
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">
          {t('config.lookups.value.title', 'Values')}
        </h3>
        <Button size="sm" onClick={openAdd}>
          {t('config.lookups.value.add', 'Add value')}
        </Button>
      </div>

      <Card className="rounded-xl p-6">
        <DataTable
          data={group.values}
          columns={columns}
          rowKey={(v) => v.id}
          search={(v) => `${v.label} ${v.value}`}
          searchPlaceholder={t('config.lookups.value.search', 'Search values…')}
          tableId={`lookup-values-${group.key}`}
          empty={
            <p className="text-foreground/60">
              {t('config.lookups.value.empty', 'No values yet.')}
            </p>
          }
        />
      </Card>

      <ValueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        groupId={group.id}
        editing={editing}
        onSaved={load}
      />
    </div>
  );
}

function ValueDialog({
  open,
  onOpenChange,
  groupId,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string;
  editing: ValueRow | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLookupValueDto>({
    resolver: zodResolver(createLookupValueSchema),
    defaultValues: { label: '', value: '', order: 0 },
  });

  useEffect(() => {
    if (open) {
      reset({
        label: editing?.label ?? '',
        value: editing?.value ?? '',
        order: editing?.order ?? 0,
      });
    }
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await apiSend(`/lookups/values/${editing.id}`, 'PATCH', values);
        toast.success(t('config.lookups.value.saved', 'Value saved'));
      } else {
        await apiSend(`/lookups/${groupId}/values`, 'POST', values);
        toast.success(t('config.lookups.value.added', 'Value added'));
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error(t('config.lookups.value.saveFailed', 'Failed to update value'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing
              ? t('config.lookups.value.editTitle', 'Edit value')
              : t('config.lookups.value.addTitle', 'Add value')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label={t('config.lookups.value.label', 'Label')} error={errors.label?.message}>
            <Input hasError={!!errors.label} {...register('label')} />
          </FormField>
          <FormField label={t('config.lookups.value.value', 'Value')} error={errors.value?.message}>
            <Input hasError={!!errors.value} {...register('value')} />
          </FormField>
          <FormField label={t('config.lookups.value.order', 'Order')} error={errors.order?.message}>
            <Input
              type="number"
              hasError={!!errors.order}
              {...register('order', { valueAsNumber: true })}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ConfigLookupDetail;
