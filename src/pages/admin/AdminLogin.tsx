import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Logo } from '../../components/brand/Logo';
import { PackIllustration } from '../../components/product/PackIllustration';
import { Field } from '../../components/ui/Field';
import { useAuth } from '../../hooks/useAuth';
import { DEMO_CREDENTIALS } from '../../services/authService';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    document.title = 'Admin login · Freelan Sri Lanka';
  }, []);

  if (user) return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await login(v.email, v.password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    }
  });

  return (
    <div className="grid min-h-[100svh] bg-cream lg:grid-cols-2">
      {/* Brand panel */}
      <div className="grain relative hidden overflow-hidden bg-chilli p-12 text-cream lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -right-32 -bottom-32 size-[560px] rounded-full bg-turmeric/35 blur-3xl" />
        <Link to="/" aria-label="Freelan home" className="relative">
          <Logo />
        </Link>
        <div className="relative">
          <div className="mb-10 flex items-end gap-4" aria-hidden="true">
            <PackIllustration shape="canister" name="Curry Powder" palette={{ body: '#4A0410', accent: '#FFC300', ink: '#FFF8EC' }} className="w-28 -rotate-6" />
            <PackIllustration shape="pouch" name="Turmeric" palette={{ body: '#FFC300', accent: '#D90429', ink: '#4A0410' }} className="w-36" />
            <PackIllustration shape="bottle" name="Chilli Crush" palette={{ body: '#FFF8EC', accent: '#D90429', ink: '#4A0410' }} className="w-24 rotate-6" />
          </div>
          <h1 className="font-display text-5xl leading-[1.02] font-black tracking-tight">
            Every order,
            <br />
            <span className="text-turmeric italic">one sheet.</span>
          </h1>
          <p className="mt-4 max-w-sm text-cream/75">Review incoming orders, approve or reject them, and keep customers moving.</p>
        </div>
        <p className="relative text-sm text-cream/50">Freelan Sri Lanka · staff only</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-block rounded-2xl bg-maroon p-3 lg:hidden" aria-label="Freelan home">
            <Logo />
          </Link>
          <h2 className="font-display text-4xl font-black tracking-tight text-maroon">Sign in</h2>
          <p className="mt-2 text-ink/60">Use your admin account to manage orders.</p>

          {import.meta.env.DEV && (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-turmeric-600/50 bg-turmeric/15 p-4 text-sm">
              <p className="font-bold text-maroon">Demo credentials (dev only)</p>
              <p className="mt-1 font-mono text-xs text-ink/75">
                {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
              </p>
              <button
                type="button"
                className="focus-dark mt-2 text-xs font-bold text-chilli underline underline-offset-2"
                onClick={() => {
                  setValue('email', DEMO_CREDENTIALS.email, { shouldValidate: true });
                  setValue('password', DEMO_CREDENTIALS.password, { shouldValidate: true });
                }}
              >
                Fill demo credentials
              </button>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl bg-chilli/10 p-4 text-sm font-medium text-chilli-700">
              <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <Field label="Email" icon={Mail} error={errors.email?.message} required>
              {(id, d) => <input id={id} aria-describedby={d} type="email" autoComplete="username" placeholder="you@freelan.lk" {...register('email')} />}
            </Field>
            <Field
              label="Password"
              icon={Lock}
              error={errors.password?.message}
              required
              trailing={
                <button type="button" onClick={() => setShow((s) => !s)} className="focus-dark rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
                  {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                </button>
              }
            >
              {(id, d) => <input id={id} aria-describedby={d} type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" {...register('password')} />}
            </Field>
            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-dark flex w-full items-center justify-center gap-2 rounded-full bg-chilli px-6 py-4 font-bold text-cream shadow-lg shadow-chilli/25 transition hover:bg-chilli-600 disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-8 text-center text-sm">
            <Link to="/" className="font-semibold text-maroon/70 hover:text-maroon">
              ← Back to website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
