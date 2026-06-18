'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, MapPin, Sparkles, Clock } from 'lucide-react';

interface SearchFiltersProps {
  currentRegion: string;
  currentDifficulty: string;
  currentSearch: string;
}

export default function SearchFilters({
  currentRegion,
  currentDifficulty,
  currentSearch,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="w-full flex flex-col gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
      {/* Search status header */}
      {currentSearch && (
        <div className="text-xs text-zinc-500 font-medium">
          Menampilkan hasil untuk pencarian:{' '}
          <span className="text-[#ff6b00] font-bold">"{currentSearch}"</span>
        </div>
      )}

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider pr-2 border-r border-zinc-100">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Filter</span>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={currentRegion}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            className="text-xs font-semibold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-[#ff6b00] text-zinc-700 transition-colors"
          >
            <option value="">Semua Wilayah</option>
            <option value="Jawa">Jawa</option>
            <option value="Padang">Padang</option>
            <option value="Sunda">Sunda</option>
            <option value="Betawi">Betawi</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={currentDifficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="text-xs font-semibold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-[#ff6b00] text-zinc-700 transition-colors"
          >
            <option value="">Semua Kesulitan</option>
            <option value="mudah">Mudah</option>
            <option value="sedang">Sedang</option>
            <option value="sulit">Sulit</option>
          </select>
        </div>

        {/* Reset Filters */}
        {(currentRegion || currentDifficulty || currentSearch) && (
          <button
            onClick={() => router.push('/')}
            className="text-xs font-bold text-zinc-400 hover:text-[#ff6b00] transition-colors ml-auto py-1"
          >
            Bersihkan Filter
          </button>
        )}
      </div>
    </div>
  );
}
