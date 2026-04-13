import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterBarProps {
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

export function FilterBar({ options, value, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
            value === opt.value
              ? 'bg-accent-light text-white'
              : 'bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className="ml-1.5 opacity-70">({opt.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
