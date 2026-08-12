import type { DashboardSummary } from './types';

interface KpiCardsProps {
  summary: DashboardSummary | null;
}

interface KpiDef {
  key: keyof DashboardSummary;
  label: string;
  icon: string;
  format?: (val: number) => string;
}

const KPI_DEFS: KpiDef[] = [
  { key: 'total', label: 'Total de Registros', icon: '📊' },
  { key: 'desafios', label: 'Desafios', icon: '🎯' },
  { key: 'projetos', label: 'Projetos', icon: '🚀' },
  { key: 'empresas', label: 'Empresas Envolvidas', icon: '🏢' },
  { key: 'proponentes', label: 'Proponentes Únicos', icon: '👤' },
  { 
    key: 'completude_media', 
    label: 'Completude Média', 
    icon: '⚡',
    format: (v) => `${v}%` 
  },
];

export default function KpiCards({ summary }: KpiCardsProps) {
  if (!summary) return null;

  return (
    <div className="kpi-grid">
      {KPI_DEFS.map((kpi) => {
        const rawValue = summary[kpi.key];
        const numericVal = typeof rawValue === 'number' ? rawValue : 0;
        const displayValue = kpi.format ? kpi.format(numericVal) : numericVal;

        return (
          <div className="kpi-card" key={kpi.key}>
            <div className="kpi-icon-wrapper">
              <span className="kpi-icon">{kpi.icon}</span>
            </div>
            <div className="kpi-content">
              <span className="kpi-value">{displayValue}</span>
              <span className="kpi-label">{kpi.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}