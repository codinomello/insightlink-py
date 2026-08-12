import { useEffect, useState, useCallback } from 'react';
import { getSummary, getProjects, clearProjects } from './api';
import type { DashboardSummary, Project } from './types';

import KpiCards from './KpiCards';
import Charts from './Charts';
import UploadPanel from './UploadPanel';
import ProjectsTable from './ProjectsTable';

export default function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega / Atualiza todos os dados do Dashboard
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, projectsRes] = await Promise.all([
        getSummary(),
        getProjects(),
      ]);
      setSummary(summaryRes.data);
      setProjects(projectsRes.data);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados. Verifique se o servidor backend está rodando.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Limpa todos os dados salvos
  const handleClearAll = async () => {
    if (!confirm('Deseja realmente apagar TODOS os registros salvos? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      await clearProjects();
      await fetchData();
    } catch (err: any) {
      alert('Erro ao apagar registros: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <header className="app-header">
        <div className="brand flex-align">
          <span className="brand-logo">💡</span>
          <div>
            <h1>InsightLink</h1>
            <p className="sub-title">Painel Executivo de Inovação & Desafios</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchData} title="Atualizar dados">
            🔄 Atualizar
          </button>
          {projects.length > 0 && (
            <button className="btn btn-danger" onClick={handleClearAll} title="Limpar todos os registros">
              🗑️ Limpar Tudo
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {error && <div className="alert-error">{error}</div>}

        {/* Painel de Upload */}
        <UploadPanel onImported={fetchData} />

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando dados do painel...</p>
          </div>
        ) : (
          <>
            {/* Indicadores Principais (KPIs) */}
            <KpiCards summary={summary} />

            {/* Gráficos do Dashboard */}
            <Charts summary={summary} />

            {/* Tabela Interativa de Registros */}
            <ProjectsTable projects={projects} onChanged={fetchData} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>InsightLink &copy; {new Date().getFullYear()} — Integrado ao ENIAC Link+</p>
      </footer>
    </div>
  );
}