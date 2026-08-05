import { useMemo, useState } from 'react'
import { deleteProject } from '../api'

export default function ProjectsTable({ projects, onChanged }) {
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [selected, setSelected] = useState(null)

  const empresas = useMemo(
    () => [...new Set(projects.map((p) => p.empresa).filter(Boolean))].sort(),
    [projects]
  )

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (tipoFiltro && p.tipo !== tipoFiltro) return false
      if (empresaFiltro && p.empresa !== empresaFiltro) return false
      if (search) {
        const haystack = `${p.titulo} ${p.proponente} ${p.empresa}`.toLowerCase()
        if (!haystack.includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [projects, search, tipoFiltro, empresaFiltro])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Remover este registro?')) return
    await deleteProject(id)
    onChanged()
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="table-section">
      <div className="table-filters">
        <input
          type="text"
          placeholder="Pesquisar por título, proponente ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="Desafio">Desafio</option>
          <option value="Projeto">Projeto</option>
        </select>
        <select value={empresaFiltro} onChange={(e) => setEmpresaFiltro(e.target.value)}>
          <option value="">Todas as empresas</option>
          {empresas.map((emp) => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Proponente</th>
              <th>Empresa</th>
              <th>Cargo</th>
              <th>Completude</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="empty-row">Nenhum registro encontrado.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} onClick={() => setSelected(p)}>
                <td>{p.titulo}</td>
                <td><span className={`badge ${p.tipo === 'Desafio' ? 'badge-blue' : 'badge-orange'}`}>{p.tipo}</span></td>
                <td>{p.proponente}</td>
                <td>{p.empresa}</td>
                <td>{p.cargo}</td>
                <td>
                  <div className="completude-bar">
                    <div className="completude-fill" style={{ width: `${p.completude || 0}%` }} />
                  </div>
                </td>
                <td>
                  <button className="btn-icon" onClick={(e) => handleDelete(p.id, e)} title="Remover">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>
            <h2>{selected.titulo}</h2>
            <span className={`badge ${selected.tipo === 'Desafio' ? 'badge-blue' : 'badge-orange'}`}>{selected.tipo}</span>

            <div className="drawer-meta">
              <p><strong>Proponente:</strong> {selected.proponente || '—'}</p>
              <p><strong>E-mail:</strong> {selected.email || '—'}</p>
              <p><strong>Telefone:</strong> {selected.telefone || '—'}</p>
              <p><strong>Empresa:</strong> {selected.empresa || '—'}</p>
              <p><strong>Cargo:</strong> {selected.cargo || '—'}</p>
              {selected.mentor && <p><strong>Mentor:</strong> {selected.mentor}</p>}
              <p><strong>Arquivo de origem:</strong> {selected.origem_arquivo}</p>
            </div>

            {selected.objetivo && (
              <div className="drawer-block">
                <h4>Objetivo</h4>
                <p>{selected.objetivo}</p>
              </div>
            )}
            {selected.contexto_limitacoes && (
              <div className="drawer-block">
                <h4>Contexto e Limitações</h4>
                <p>{selected.contexto_limitacoes}</p>
              </div>
            )}
            {selected.requisitos_tecnicos && (
              <div className="drawer-block">
                <h4>Requisitos Técnicos</h4>
                <p>{selected.requisitos_tecnicos}</p>
              </div>
            )}
            {selected.restricoes && (
              <div className="drawer-block">
                <h4>Restrições</h4>
                <p>{selected.restricoes}</p>
              </div>
            )}
            {selected.entregaveis_sucesso && (
              <div className="drawer-block">
                <h4>Entregáveis e Critérios de Sucesso</h4>
                <p>{selected.entregaveis_sucesso}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
