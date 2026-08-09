import { useState } from 'react';
import { Search } from 'lucide-react';

export interface JobFilters {
  q: string;
  location: string;
  workMode: '' | 'remote' | 'hybrid' | 'onsite';
  experienceLevel: '' | 'entry' | 'mid' | 'senior' | 'lead';
  salaryMin: string;
}

export function FilterBar({
  filters,
  onChange,
  onSaveSearch,
}: {
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
  onSaveSearch?: () => void;
}) {
  const [local, setLocal] = useState(filters);

  function update<K extends keyof JobFilters>(key: K, value: JobFilters[K]) {
    const next = { ...local, [key]: value };
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-2 rounded-md border border-border px-3 py-2">
        <Search className="h-4 w-4 text-ink-muted" />
        <input
          value={local.q}
          onChange={(e) => update('q', e.target.value)}
          placeholder="Search title, company, skill…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      <input
        value={local.location}
        onChange={(e) => update('location', e.target.value)}
        placeholder="Location"
        className="rounded-md border border-border px-3 py-2 text-sm outline-none md:w-40"
      />
      <select
        value={local.workMode}
        onChange={(e) => update('workMode', e.target.value as JobFilters['workMode'])}
        className="rounded-md border border-border px-3 py-2 text-sm outline-none md:w-36"
      >
        <option value="">Any mode</option>
        <option value="remote">Remote</option>
        <option value="hybrid">Hybrid</option>
        <option value="onsite">Onsite</option>
      </select>
      <select
        value={local.experienceLevel}
        onChange={(e) => update('experienceLevel', e.target.value as JobFilters['experienceLevel'])}
        className="rounded-md border border-border px-3 py-2 text-sm outline-none md:w-36"
      >
        <option value="">Any level</option>
        <option value="entry">Entry</option>
        <option value="mid">Mid</option>
        <option value="senior">Senior</option>
        <option value="lead">Lead</option>
      </select>
      <input
        type="number"
        value={local.salaryMin}
        onChange={(e) => update('salaryMin', e.target.value)}
        placeholder="Min salary (₹)"
        className="rounded-md border border-border px-3 py-2 text-sm outline-none md:w-32"
      />
      {onSaveSearch && (
        <button onClick={onSaveSearch} className="btn-secondary whitespace-nowrap py-2 text-sm">Save search</button>
      )}
    </div>
  );
}
