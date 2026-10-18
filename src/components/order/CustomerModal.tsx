import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building, Phone, User } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Customer } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80, 'That name is a little long'),
  phone: z
    .string()
    .trim()
    .min(1, 'A phone number is required so we can confirm your order')
    .refine((v) => /^\+?[\d\s-]{9,16}$/.test(v) && v.replace(/\D/g, '').length >= 9, 'Enter a valid phone number, e.g. 077 123 4567'),
  company: z.string().trim().max(100).optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  initial: Customer | null;
  onClose: () => void;
  onSubmit: (c: Customer) => void;
  /** When true the modal can't be dismissed (used on /order with no customer yet). */
  required?: boolean;
}

export function CustomerModal({ open, initial, onClose, onSubmit, required }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', phone: '', company: '' } });

  useEffect(() => {
    if (open) reset({ name: initial?.name ?? '', phone: initial?.phone ?? '', company: initial?.company ?? '' });
  }, [open, initial, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={required}
      size="sm"
      tone="brand"
      title={
        <>
          Who's <span className="scribble">ordering</span>?
        </>
      }
      description="We'll put your name on the order sheet and call to confirm delivery."
    >
      <form
        noValidate
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((v) => onSubmit({ name: v.name, phone: v.phone, company: v.company ? v.company : undefined }))}
      >
        <Field label="Your name" icon={User} error={errors.name?.message} required>
          {(id, describedBy) => (
            <input id={id} aria-describedby={describedBy} autoComplete="name" data-autofocus placeholder="e.g. Nimal Perera" {...register('name')} />
          )}
        </Field>
        <Field label="Phone number" icon={Phone} error={errors.phone?.message} required>
          {(id, describedBy) => (
            <input id={id} aria-describedby={describedBy} type="tel" inputMode="tel" autoComplete="tel" placeholder="077 123 4567" {...register('phone')} />
          )}
        </Field>
        <Field label="Company or shop name" icon={Building} error={errors.company?.message} hint="Optional">
          {(id, describedBy) => <input id={id} aria-describedby={describedBy} autoComplete="organization" placeholder="e.g. Perera Stores" {...register('company')} />}
        </Field>
        <button
          type="submit"
          className="focus-dark group mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-chilli px-6 py-4 font-bold text-cream shadow-lg shadow-chilli/25 transition hover:bg-chilli-600 active:scale-[0.98]"
        >
          Continue to order sheet
          <ArrowRight className="size-5 transition group-hover:translate-x-1" />
        </button>
      </form>
    </Modal>
  );
}
