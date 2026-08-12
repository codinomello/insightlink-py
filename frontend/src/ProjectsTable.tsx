import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { deleteProject } from './api';
import type { Project } from './types';

interface ProjectsTableProps {
  projects?: Project[];
  onChanged: () => void;
}

export default function ProjectsTable({ projects = [], onChanged }: ProjectsTableProps) {
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState('');
  const [selected, setSelected] = useState<Project | null>(null);

  // Garante que safeProjects é sempre um array válido para evitar crash (.map is not a function)
  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);

  const empresas = useMemo(
    () =>
      [
        ...new Set(
          safeProjects
            .map((p) => p.empresa)
            .filter((e): e is string => Boolean(e))
        ),
      ].sort(),
    [safeProjects]
  );

  const filtered = useMemo(() => {
    return safeProjects.filter((p) => {
      if (tipoFiltro && p.tipo !== tipoFiltro) return false;
      if (empresaFiltro && p.empresa !== empresaFiltro) return false;
      if (search) {
        const haystack = `${p.titulo || ''} ${p.proponente || ''} ${p.empresa || ''}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [safeProjects, search, tipoFiltro, empresaFiltro]);

  const handleDelete = async (id: string | number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!confirm('Remover este registro?')) return;
    try {
      await deleteProject(id);
      onChanged();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error('Erro ao eliminar projeto:', err);
    }
  };

  return (
    <div className="table-section">
      <div className="table-filters">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Pesquisar por título, proponente ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="select-group">
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="Desafio">Desafio</option>
            <option value="Projeto">Projeto</option>
          </select>
          <select value={empresaFiltro} onChange={(e) => setEmpresaFiltro(e.target.value)}>
            <option value="">Todas as empresas</option>
            {empresas.map((emp) => (
              <option key={emp} value={emp}>
                {emp}
              </option>
            ))}
          </select>
        </div>
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
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)}>
                  <td style={{ fontWeight: 500 }}>{p.titulo}</td>
                  <td>
                    <span className={`badge ${p.tipo === 'Desafio' ? 'badge-blue' : 'badge-orange'}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td>{p.proponente || '—'}</td>
                  <td>{p.empresa || '—'}</td>
                  <td>{p.cargo || '—'}</td>
                  <td>
                    <div className="completude-container">
                      <div className="completude-bar">
                        <div className="completude-fill" style={{ width: `${p.completude || 0}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.completude || 0}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={(e) => handleDelete(p.id, e)} title="Remover">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}>
              ✕
            </button>
            <div style={{ marginBottom: '20px' }}>
              <span className={`badge ${selected.tipo === 'Desafio' ? 'badge-blue' : 'badge-orange'}`}>
                {selected.tipo}
              </span>
              <h2 style={{ margin: '12px 0 0 0', fontSize: '1.4rem' }}>{selected.titulo}</h2>
            </div>

            <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '24px' }}>
              <p style={{ margin: 0 }}><strong>Proponente:</strong> {selected.proponente || '—'}</p>
              <p style={{ margin: 0 }}><strong>E-mail:</strong> {selected.email || '—'}</p>
              <p style={{ margin: 0 }}><strong>Telefone:</strong> {selected.telefone || '—'}</p>
              <p style={{ margin: 0 }}><strong>Empresa:</strong> {selected.empresa || '—'}</p>
              <p style={{ margin: 0 }}><strong>Cargo:</strong> {selected.cargo || '—'}</p>
              {selected.mentor && <p style={{ margin: 0 }}><strong>Mentor:</strong> {selected.mentor}</p>}
              <p style={{ margin: 0 }}><strong>Arquivo de origem:</strong> {selected.origem_arquivo || '—'}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selected.objetivo && (
                <div className="drawer-block">
                  <h4 style={{ margin: '0 0 6px 0', color: '#38bdf8' }}>Objetivo</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>{selected.objetivo}</p>
                </div>
              )}
              {selected.contexto_limitacoes && (
                <div className="drawer-block">
                  <h4 style={{ margin: '0 0 6px 0', color: '#38bdf8' }}>Contexto e Limitações</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>{selected.contexto_limitacoes}</p>
                </div>
              )}
              {selected.requisitos_tecnicos && (
                <div className="drawer-block">
                  <h4 style={{ margin: '0 0 6px 0', color: '#38bdf8' }}>Requisitos Técnicos</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>{selected.requisitos_tecnicos}</p>
                </div>
              )}
              {selected.restricoes && (
                <div className="drawer-block">
                  <h4 style={{ margin: '0 0 6px 0', color: '#38bdf8' }}>Restrições</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>{selected.restricoes}</p>
                </div>
              )}
              {selected.entregaveis_sucesso && (
                <div className="drawer-block">
                  <h4 style={{ margin: '0 0 6px 0', color: '#38bdf8' }}>Entregáveis e Critérios de Sucesso</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>{selected.entregaveis_sucesso}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}