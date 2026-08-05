import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#1b3a5c', '#f5a623', '#2f8f6e', '#c0392b', '#6c5ce7', '#00b8d9', '#e17055']

export default function Charts({ summary }) {
  if (!summary) return null
  const semDados = !summary.total

  if (semDados) {
    return (
      <div className="empty-state">
        Importe arquivos do ENIAC Link+ para visualizar os gráficos e indicadores.
      </div>
    )
  }

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h3>Registros por Empresa</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={summary.por_empresa}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
            <XAxis dataKey="nome" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="quantidade" fill="#1b3a5c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Distribuição por Cargo</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={summary.por_cargo}
              dataKey="quantidade"
              nameKey="nome"
              cx="50%"
              cy="50%"
              outerRadius={95}
              label={(entry) => `${entry.nome} (${entry.quantidade})`}
            >
              {summary.por_cargo.map((entry, index) => (
                <Cell key={entry.nome} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Desafios vs Projetos</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={summary.por_tipo}
              dataKey="quantidade"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              label={(entry) => `${entry.nome} (${entry.quantidade})`}
            >
              {summary.por_tipo.map((entry, index) => (
                <Cell key={entry.nome} fill={COLORS[(index + 2) % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
