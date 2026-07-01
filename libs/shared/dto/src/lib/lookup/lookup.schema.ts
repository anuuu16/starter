import { z } from 'zod';

/** A lookup group is a named, keyed set of selectable values (e.g. "countries"). */
export const createLookupGroupSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Use lowercase letters, numbers, _ or -'),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export type CreateLookupGroupDto = z.infer<typeof createLookupGroupSchema>;

/** Group metadata is editable; the immutable `key` is intentionally omitted. */
export const updateLookupGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateLookupGroupDto = z.infer<typeof updateLookupGroupSchema>;

export const createLookupValueSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  order: z.number().int().min(0).optional(),
});

export type CreateLookupValueDto = z.infer<typeof createLookupValueSchema>;

export const updateLookupValueSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateLookupValueDto = z.infer<typeof updateLookupValueSchema>;
