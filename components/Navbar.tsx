'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, LogOut, Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';

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
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
      <input
        type="text"
        placeholder="Cari resep, bahan, wilayah..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-9 pl-10 pr-4 rounded-xl border border-border bg-bg text-sm placeholder-ink-muted focus:outline-none focus:border-primary focus:bg-surface transition-all text-ink"
      />
    </form>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    if (!mounted) return <Laptop className="w-4.5 h-4.5 opacity-0" />;
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
    <nav className="fixed top-0 left-0 right-0 z-50 h-[56px] border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between transition-colors">
      {/* Left - Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
          E
        </div>
        <span
          className="font-semibold text-xl tracking-tight text-ink"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Enaknyo
        </span>
      </Link>

      {/* Center - Search Box wrapped in Suspense */}
      <div className="hidden md:block w-[500px]">
        <Suspense fallback={<div className="w-full h-9 rounded-xl bg-surface-muted border border-border animate-pulse" />}>
          <SearchForm />
        </Suspense>
      </div>

      {/* Right - Navigation */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 text-ink-muted hover:text-primary hover:bg-surface-muted rounded-xl transition-all cursor-pointer"
          title={getThemeTitle()}
          aria-label="Toggle Theme"
        >
          {renderThemeIcon()}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink-muted hidden sm:inline">
              Halo, {user.email?.split('@')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-ink-muted hover:text-primary hover:bg-surface-muted rounded-xl transition-all cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="text-ink-muted hover:text-primary font-medium transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-xl border border-border text-ink hover:border-primary hover:text-primary font-medium transition-all"
            >
              Daftar
            </Link>
          </div>
        )}

        <Link
          href="/write"
          className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Resep</span>
        </Link>
      </div>
    </nav>
  );
}
