import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Loader2, Mail, Lock, AlertCircle,
  UserCheck, Network, KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { AuthTokens } from '../types';
import logo from '../assets/eBen Logo + YP Blue and Green.avif';

interface FormData {
  email: string;
  password: string;
}

const CAPABILITIES = [
  {
    icon: UserCheck,
    title: 'Employee Records',
    desc: 'Onboard, update, and track every employee across your organisation',
  },
  {
    icon: Network,
    title: 'Company & Departments',
    desc: 'Structure teams under companies with full hierarchical control',
  },
  {
    icon: KeyRound,
    title: 'Role-Based Access',
    desc: 'Admin, HR Manager, and Employee — each with the right permissions',
  },
];

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'employee' ? '/profile' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onInvalid = () => {
    const el = formRef.current;
    if (!el) return;
    el.classList.remove('form-shake');
    void el.offsetWidth;
    el.classList.add('form-shake');
  };

  const onSubmit = async ({ email, password }: FormData) => {
    setErrorMsg('');
    try {
      await login(email, password);
      const raw = localStorage.getItem('auth_tokens');
      if (raw) {
        const { user: u } = JSON.parse(raw) as AuthTokens;
        navigate(u.role === 'employee' ? '/profile' : '/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg =
        (Array.isArray(data?.non_field_errors) ? String(data.non_field_errors[0]) : null) ??
        (typeof data?.detail === 'string' ? data.detail : null) ??
        'Something went wrong. Please try again.';
      setErrorMsg(msg);
    }
  };

  return (
    <>
      <style>{`
        /* ── Dot-grid drift ─────────────────────────────────────────── */
        @keyframes driftGrid {
          0%   { background-position: 0 0; }
          100% { background-position: 32px 32px; }
        }

        /* ── Organic blob morph ─────────────────────────────────────── */
        @keyframes morphA {
          0%,100% { border-radius: 60% 40% 55% 45% / 55% 45% 60% 40%; transform: translate(0,0) scale(1); }
          33%     { border-radius: 40% 60% 45% 55% / 45% 60% 40% 55%; transform: translate(30px,-20px) scale(1.05); }
          66%     { border-radius: 55% 45% 60% 40% / 60% 40% 55% 45%; transform: translate(-20px,25px) scale(0.96); }
        }
        @keyframes morphB {
          0%,100% { border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; transform: translate(0,0) scale(1); }
          40%     { border-radius: 60% 40% 50% 50% / 55% 45% 60% 40%; transform: translate(-35px,20px) scale(1.08); }
          80%     { border-radius: 40% 60% 60% 40% / 45% 55% 40% 60%; transform: translate(20px,-30px) scale(0.94); }
        }

        /* ── Panel entrances ────────────────────────────────────────── */
        @keyframes fadeInLeft {
          from { opacity:0; transform:translateX(-48px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity:0; transform:translateX(48px); }
          to   { opacity:1; transform:translateX(0); }
        }

        /* ── Capability cards stagger ───────────────────────────────── */
        @keyframes cardUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── Underline grow ─────────────────────────────────────────── */
        @keyframes growLine {
          from { width:0; opacity:0; }
          to   { width:100%; opacity:1; }
        }

        /* ── Form shake ─────────────────────────────────────────────── */
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          15%     { transform:translateX(-9px); }
          30%     { transform:translateX(9px); }
          45%     { transform:translateX(-6px); }
          60%     { transform:translateX(6px); }
          75%     { transform:translateX(-3px); }
          90%     { transform:translateX(3px); }
        }

        /* ── Helpers ────────────────────────────────────────────────── */
        .dot-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1.5px, transparent 1.5px);
          background-size: 32px 32px;
          animation: driftGrid 18s linear infinite;
        }
        .blob-a {
          animation: morphA 12s ease-in-out infinite;
          filter: blur(48px);
        }
        .blob-b {
          animation: morphB 16s ease-in-out infinite;
          filter: blur(60px);
        }
        .panel-left  { animation: fadeInLeft  0.65s cubic-bezier(.22,1,.36,1) both; }
        .panel-right { animation: fadeInRight 0.65s cubic-bezier(.22,1,.36,1) 0.12s both; }

        .cap-card-1 { animation: cardUp 0.55s ease 0.5s both; }
        .cap-card-2 { animation: cardUp 0.55s ease 0.68s both; }
        .cap-card-3 { animation: cardUp 0.55s ease 0.86s both; }

        .underline-accent::after {
          content:'';
          display:block;
          height:3px;
          border-radius:9999px;
          background:#22C55E;
          margin-top:3px;
          animation: growLine 0.6s ease 0.9s both;
        }

        .form-shake { animation: shake 0.45s ease; }

        .eben-input:focus {
          outline:none;
          border-color:#22C55E;
          box-shadow:0 0 0 3px rgba(34,197,94,0.18);
          background:#fff;
        }
      `}</style>

      <div className="min-h-screen flex">

        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL
        ══════════════════════════════════════════════════════════ */}
        <div className="panel-left hidden lg:flex lg:w-5/12 xl:w-1/2
          flex-col justify-between relative overflow-hidden p-12
          bg-[#2D3B55]">

          {/* Layer 1 — drifting dot grid */}
          <div className="dot-grid absolute inset-0 pointer-events-none" />

          {/* Layer 2 — morphing ambient glows */}
          <div className="blob-a absolute -top-20 -right-20 w-[26rem] h-[22rem]
            bg-[#22C55E]/[0.13] pointer-events-none" />
          <div className="blob-b absolute -bottom-24 -left-16 w-[24rem] h-[20rem]
            bg-white/[0.06] pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10">
            <img src={logo} alt="eBen" className="h-14 w-auto drop-shadow-lg" />
          </div>

          {/* Headline */}
          <div className="relative z-10">
            <h1 className="text-4xl xl:text-[2.8rem] font-bold text-white leading-[1.18]">
              One platform.<br />
              <span className="text-[#22C55E] underline-accent inline-block">
                Every HR need.
              </span>
            </h1>
            <p className="text-white/55 mt-5 text-[0.95rem] leading-relaxed max-w-sm">
              Manage employees, structure departments, and oversee
              companies.
            </p>

            {/* Capability list */}
            <ul className="mt-10 space-y-5">
              {CAPABILITIES.map(({ icon: Icon, title, desc }, i) => (
                <li key={title} className={`cap-card-${i + 1} flex items-start gap-3.5`}>
                  <span className="mt-0.5 flex-shrink-0 w-11 h-11 rounded-xl
                    bg-[#22C55E]/15 border border-[#22C55E]/25
                    flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#22C55E]" />
                  </span>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                    <p className="text-white/50 text-xs mt-0.5 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-white/25 text-xs">
            © 2025 eBen. All rights reserved.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL
        ══════════════════════════════════════════════════════════ */}
        <div className="panel-right flex-1 flex items-center justify-center
          bg-white px-6 py-12">

          <div className="w-full max-w-md bg-white rounded-2xl p-10
            shadow-[0_6px_48px_rgba(45,59,85,0.08)]">

            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <img src={logo} alt="eBen" className="h-10 w-auto" />
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-[1.75rem] font-bold text-[#2D3B55] leading-tight">
                Welcome back
              </h2>
              <p className="text-gray-500 mt-1.5 text-sm">
                Sign in to access your HR workspace
              </p>
            </div>

            {/* ── Form ───────────────────────────────────────────── */}
            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit, onInvalid)}
              noValidate
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2
                      w-[17px] h-[17px] text-gray-400 pointer-events-none"
                    aria-hidden
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className={[
                      'eben-input w-full h-12 pl-[2.6rem] pr-4 rounded-xl border',
                      'text-sm text-gray-900 placeholder:text-gray-400',
                      'transition-colors bg-gray-50 hover:border-gray-300',
                      errors.email
                        ? 'border-red-400 bg-red-50/50'
                        : 'border-gray-200',
                    ].join(' ')}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2
                      w-[17px] h-[17px] text-gray-400 pointer-events-none"
                    aria-hidden
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Min. 8 characters"
                    className={[
                      'eben-input w-full h-12 pl-[2.6rem] pr-11 rounded-xl border',
                      'text-sm text-gray-900 placeholder:text-gray-400',
                      'transition-colors bg-gray-50 hover:border-gray-300',
                      errors.password
                        ? 'border-red-400 bg-red-50/50'
                        : 'border-gray-200',
                    ].join(' ')}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg
                      text-gray-400 hover:text-gray-600 hover:bg-gray-100
                      transition-all duration-150"
                  >
                    {showPassword
                      ? <EyeOff className="w-[18px] h-[18px]" />
                      : <Eye    className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Inline error */}
              {errorMsg && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl
                  bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm text-red-600 leading-snug">{errorMsg}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl font-semibold text-white text-sm mt-1
                  bg-[#2D3B55] hover:bg-[#22C55E]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-300 flex items-center justify-center gap-2
                  shadow-sm hover:shadow-[0_4px_20px_rgba(34,197,94,0.35)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-9">
              © 2025 eBen. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
