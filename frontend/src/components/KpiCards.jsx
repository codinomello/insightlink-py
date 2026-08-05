const KPI_DEFS = [
  { key: 'total', label: 'Total de Registros', icon: '📊' },
  { key: 'desafios', label: 'Desafios', icon: '🎯' },
  { key: 'projetos', label: 'Projetos', icon: '🚀' },
  { key: 'empresas', label: 'Empresas Envolvidas', icon: '🏢' },
  { key: 'proponentes', label: 'Proponentes Únicos', icon: '👤' },
  { key: 'completude_media', label: 'Completude Média (%)', icon: '✅' },
]

export default function KpiCards({ summary }) {
  if (!summary) return null
  return (
    <div className="kpi-grid">
      {KPI_DEFS.map((kpi) => (
        <div className="kpi-card" key={kpi.key}>
          <div className="kpi-icon">{kpi.icon}</div>
          <div>
            <div className="kpi-value">{summary[kpi.key] ?? 0}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
