import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/format';
import { AuthError } from '../../services/authService';

const emailSchema = z.object({
  email: z.string().trim().min(1, 'New email is required').email('Enter a valid email address'),
  currentPassword: z.string().min(1, 'Enter your current password to confirm'),
});
type EmailValues = z.infer<typeof emailSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((v) => v.newPassword === v.confirm, { message: 'Passwords don’t match', path: ['confirm'] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: 'New password must be different from the current one', path: ['newPassword'] });
type PasswordValues = z.infer<typeof passwordSchema>;

/** 0–4 score from length and character variety. */
function strength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, Math.max(1, score - (pw.length < 8 ? 1 : 0)));
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score] };
}

const BAR = ['', 'bg-chilli', 'bg-saffron', 'bg-turmeric', 'bg-leaf'];

function PasswordInput({ id, d, show, ...rest }: { id: string; d: string | undefined; show: boolean } & React.ComponentProps<'input'>) {
  return <input id={id} aria-describedby={d} type={show ? 'text' : 'password'} {...rest} />;
}

export default function Profile() {
  const { user, changeEmail, changePassword } = useAuth();
  const toast = useToast();
  const [show, setShow] = useState(false);

  useEffect(() => {
    document.title = 'My profile · Freelan admin';
  }, []);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: '', currentPassword: '' } });
  const pwForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });
  const pw = strength(pwForm.watch('newPassword'));

  const toggle = (
    <button type="button" onClick={() => setShow((s) => !s)} className="focus-dark rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label={show ? 'Hide passwords' : 'Show passwords'} aria-pressed={show}>
      {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
    </button>
  );

  const submitEmail = emailForm.handleSubmit(async (v) => {
    if (v.email.toLowerCase() === user?.email.toLowerCase()) {
      emailForm.setError('email', { message: 'That is already your email' });
      return;
    }
    try {
      await changeEmail(v.currentPassword, v.email);
      emailForm.reset();
      toast.success('Email updated. Use it next time you sign in.');
    } catch (e) {
      if (e instanceof AuthError && e.field === 'currentPassword') emailForm.setError('currentPassword', { message: e.message });
      toast.error(e instanceof Error ? e.message : 'Could not update email');
    }
  });

  const submitPassword = pwForm.handleSubmit(async (v) => {
    try {
      await changePassword(v.currentPassword, v.newPassword);
      pwForm.reset();
      toast.success('Password changed.');
    } catch (e) {
      if (e instanceof AuthError && e.field === 'currentPassword') pwForm.setError('currentPassword', { message: e.message });
      toast.error(e instanceof Error ? e.message : 'Could not change password');
    }
  });

  return (
    <div>
      <p className="text-sm font-semibold text-ink/50">Account</p>
      <h1 className="font-display text-3xl font-black tracking-tight text-maroon sm:text-4xl">My Profile</h1>

      <section className="mt-6 flex items-center gap-4 rounded-3xl bg-maroon p-6 text-cream" aria-label="Profile summary">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-turmeric font-display text-3xl font-black text-maroon">{user?.name.charAt(0)}</span>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-bold">{user?.name}</p>
          <p className="truncate text-cream/70">{user?.email}</p>
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06] sm:p-7" aria-labelledby="email-heading">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-turmeric/25 text-maroon">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="email-heading" className="font-display text-xl font-bold text-maroon">
                Change email
              </h2>
              <p className="text-sm text-ink/55">Your sign-in email address.</p>
            </div>
          </div>
          <form onSubmit={submitEmail} noValidate className="mt-6 space-y-4">
            <Field label="New email" icon={Mail} error={emailForm.formState.errors.email?.message} required>
              {(id, d) => <input id={id} aria-describedby={d} type="email" autoComplete="email" placeholder={user?.email} {...emailForm.register('email')} />}
            </Field>
            <Field label="Current password" icon={Lock} error={emailForm.formState.errors.currentPassword?.message} required trailing={toggle}>
              {(id, d) => <PasswordInput id={id} d={d} show={show} autoComplete="current-password" {...emailForm.register('currentPassword')} />}
            </Field>
            <button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              className="focus-dark inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-3 font-bold text-cream hover:bg-maroon-900 disabled:opacity-70"
            >
              {emailForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Update email
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06] sm:p-7" aria-labelledby="pw-heading">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-chilli/10 text-chilli">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="pw-heading" className="font-display text-xl font-bold text-maroon">
                Change password
              </h2>
              <p className="text-sm text-ink/55">At least 8 characters.</p>
            </div>
          </div>
          <form onSubmit={submitPassword} noValidate className="mt-6 space-y-4">
            <Field label="Current password" icon={Lock} error={pwForm.formState.errors.currentPassword?.message} required trailing={toggle}>
              {(id, d) => <PasswordInput id={id} d={d} show={show} autoComplete="current-password" {...pwForm.register('currentPassword')} />}
            </Field>
            <div>
              <Field label="New password" icon={KeyRound} error={pwForm.formState.errors.newPassword?.message} required>
                {(id, d) => <PasswordInput id={id} d={d} show={show} autoComplete="new-password" {...pwForm.register('newPassword')} />}
              </Field>
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= pw.score ? BAR[pw.score] : 'bg-ink/10')} />
                  ))}
                </div>
                {pw.label && <p className="mt-1 text-xs font-semibold text-ink/60">Strength: {pw.label}</p>}
              </div>
            </div>
            <Field label="Confirm new password" icon={KeyRound} error={pwForm.formState.errors.confirm?.message} required>
              {(id, d) => <PasswordInput id={id} d={d} show={show} autoComplete="new-password" {...pwForm.register('confirm')} />}
            </Field>
            <button
              type="submit"
              disabled={pwForm.formState.isSubmitting}
              className="focus-dark inline-flex items-center gap-2 rounded-full bg-chilli px-6 py-3 font-bold text-cream hover:bg-chilli-600 disabled:opacity-70"
            >
              {pwForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Change password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
