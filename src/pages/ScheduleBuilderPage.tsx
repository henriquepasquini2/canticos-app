import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ScheduleBuilder } from '@/components/schedule/ScheduleBuilder'

export function ScheduleBuilderPage() {
  const { date } = useParams<{ date: string }>()

  if (!date) {
    return (
      <div className="text-center py-12 text-text-muted">
        Data não informada.
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <Link
        to="/admin/calendario"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao calendário
      </Link>
      <ScheduleBuilder date={date} />
    </div>
  )
}
