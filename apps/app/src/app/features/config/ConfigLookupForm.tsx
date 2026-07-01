import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createLookupGroupSchema, type CreateLookupGroupDto } from '@org/dto';
import { Button, Card, FormField, Input, Switch } from '@org/ui';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface GroupDetail {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
}

/** Create (no :key) or edit (with :key) a lookup group. */
export function ConfigLookupForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { key } = useParams<{ key: string }>();
  const isEdit = Boolean(key);

  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLookupGroupDto>({
    resolver: zodResolver(createLookupGroupSchema),
    defaultValues: { key: '', name: '', description: '', isPublic: true },
  });

  useEffect(() => {
    if (!isEdit || !key) return;
    apiGet<GroupDetail>(`/lookups/admin/group/${key}`)
      .then((g) => {
        setGroupId(g.id);
        reset({
          key: g.key,
          name: g.name,
          description: g.description ?? '',
          isPublic: g.isPublic,
        });
      })
      .catch(() => toast.error(t('config.lookups.groupLoadError', 'Failed to load group')))
      .finally(() => setLoading(false));
  }, [isEdit, key, reset, t]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && groupId) {
        await apiSend(`/lookups/${groupId}`, 'PATCH', {
          name: values.name,
          description: values.description || undefined,
          isPublic: values.isPublic,
        });
        toast.success(t('config.lookups.saved', 'Group saved'));
        navigate(`/config/lookups/${key}`);
      } else {
        await apiSend('/lookups', 'POST', {
          key: values.key,
          name: values.name,
          description: values.description || undefined,
          isPublic: values.isPublic,
        });
        toast.success(t('config.lookups.created', 'Group created'));
        navigate('/config/lookups');
      }
    } catch {
      toast.error(t('config.lookups.saveFailed', 'Failed to save group'));
    }
  });

  if (loading)
    return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/config/lookups" className="text-sm text-primary hover:underline">
          ← {t('config.lookups.title', 'Lookups')}
        </Link>
      </div>
      <Card className="rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {isEdit
            ? t('config.lookups.editTitle', 'Edit group')
            : t('config.lookups.newTitle', 'New lookup group')}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label={t('config.lookups.field.key', 'Key')} error={errors.key?.message}>
            <Input
              placeholder="countries"
              disabled={isEdit}
              hasError={!!errors.key}
              {...register('key')}
            />
          </FormField>
          <FormField label={t('config.lookups.field.name', 'Name')} error={errors.name?.message}>
            <Input
              placeholder="Countries"
              hasError={!!errors.name}
              {...register('name')}
            />
          </FormField>
          <FormField
            label={t('config.lookups.field.description', 'Description')}
            error={errors.description?.message}
          >
            <Input
              placeholder={t('config.lookups.field.descriptionHint', 'Optional')}
              {...register('description')}
            />
          </FormField>
          <Controller
            control={control}
            name="isPublic"
            render={({ field }) => (
              <label className="flex items-center gap-3 text-sm text-foreground">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                {t('config.lookups.field.isPublic', 'Publicly readable')}
              </label>
            )}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" isLoading={isSubmitting}>
              {t('common.save', 'Save')}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link to="/config/lookups">{t('common.cancel', 'Cancel')}</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ConfigLookupForm;
