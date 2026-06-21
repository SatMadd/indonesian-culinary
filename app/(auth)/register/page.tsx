'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Mail, Lock, CheckCircle2, User } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!isConfigured) {
      setErrorMsg('Supabase belum dikonfigurasi. Pastikan variabel lingkungan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY telah diatur.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        if (data?.session) {
          setSuccessMsg('Pendaftaran berhasil! Mengarahkan...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1500);
        } else {
          setSuccessMsg(
            'Pendaftaran berhasil! Silakan periksa email Anda untuk mengonfirmasi pendaftaran Anda sebelum masuk.'
          );
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans p-6 transition-colors">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-5 dark:opacity-[0.02] pointer-events-none select-none">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none" />
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-black dark:text-white" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[420px] bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/40 border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col gap-6 transition-colors">
        {/* Header */}
        <div className="flex flex-col gap-2 relative">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 hover:text-[#ff6b00] dark:hover:text-orange-400 transition-colors mb-2 self-start"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ff6b00] flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <span className="font-extrabold text-sm text-[#ff6b00] dark:text-orange-400 uppercase tracking-wider">
              Enaknyo Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
            Buat Akun Baru
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Daftar untuk mulai menyimpan dan menulis resep Anda sendiri.
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold leading-relaxed">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/60 text-green-700 dark:text-green-400 text-xs font-semibold flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="font-bold">Registrasi Sukses!</span>
            </div>
            <p className="leading-relaxed font-medium">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-[#ff6b00] dark:focus:border-orange-500 bg-white dark:bg-zinc-950 focus:bg-zinc-50/20 dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-650 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-[#ff6b00] dark:focus:border-orange-500 bg-white dark:bg-zinc-950 focus:bg-zinc-50/20 dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-650 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="password"
                required
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-[#ff6b00] dark:focus:border-orange-500 bg-white dark:bg-zinc-950 focus:bg-zinc-50/20 dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-650 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl bg-[#ff6b00] hover:bg-orange-600 disabled:bg-zinc-300 text-white font-bold text-sm shadow-md shadow-orange-500/10 transition-all active:scale-[0.98] cursor-pointer"
          >
            {loading ? 'Mendaftar...' : 'Buat Akun'}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Sudah punya akun?{' '}
          <Link
            href="/login"
            className="font-bold text-[#ff6b00] dark:text-orange-400 hover:underline"
          >
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
