'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, LogOut, Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, Theme } from '@/components/ThemeProvider';

function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
      <input
        type="text"
        placeholder="Cari resep, bahan, wilayah..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-9 pl-10 pr-4 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#ff6b00] dark:focus:border-[#ff6b00] focus:bg-white dark:focus:bg-zinc-900 transition-all text-zinc-800 dark:text-zinc-100"
      />
    </form>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const renderThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4.5 h-4.5" />;
    if (theme === 'dark') return <Moon className="w-4.5 h-4.5" />;
    return <Laptop className="w-4.5 h-4.5" />;
  };

  const getThemeTitle = () => {
    if (theme === 'light') return 'Mode Terang (Klik untuk Gelap)';
    if (theme === 'dark') return 'Mode Gelap (Klik untuk Sistem)';
    return 'Mode Sistem (Klik untuk Terang)';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[56px] border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between transition-colors">
      {/* Left - Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#ff6b00] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-500/20">
          E
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#ff6b00] to-orange-500 bg-clip-text text-transparent">
          Enaknyo
        </span>
      </Link>

      {/* Center - Search Box wrapped in Suspense */}
      <div className="hidden md:block w-[500px]">
        <Suspense fallback={<div className="w-full h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />}>
          <SearchForm />
        </Suspense>
      </div>

      {/* Right - Navigation */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Switch */}
        <button
          onClick={cycleTheme}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-[#ff6b00] dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-zinc-900 rounded-full transition-all cursor-pointer"
          title={getThemeTitle()}
          aria-label="Toggle Theme"
        >
          {renderThemeIcon()}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">
              Halo, {user.email?.split('@')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-[#ff6b00] dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-zinc-900 rounded-full transition-all cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="text-zinc-600 dark:text-zinc-300 hover:text-[#ff6b00] dark:hover:text-orange-400 font-medium transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-[#ff6b00] dark:hover:border-orange-500 hover:text-[#ff6b00] dark:hover:text-orange-400 font-medium transition-all"
            >
              Daftar
            </Link>
          </div>
        )}

        <Link
          href="/write"
          className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#ff6b00] hover:bg-orange-600 text-white text-sm font-semibold shadow-md shadow-orange-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Resep</span>
        </Link>
      </div>
    </nav>
  );
}
