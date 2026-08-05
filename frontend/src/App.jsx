import { useEffect, useState, useCallback } from 'react'
import UploadPanel from './components/UploadPanel'
import KpiCards from './components/KpiCards'
import Charts from './components/Charts'
import ProjectsTable from './components/ProjectsTable'
import { getProjects, getSummary, clearProjects } from './api'

export default function App() {
  const [summary, setSummary] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const [summaryRes, projectsRes] = await Promise.all([getSummary(), getProjects()])
    setSummary(summaryRes.data)
    setProjects(projectsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const handleClearAll = async () => {
    if (!confirm('Isso removerá todos os registros importados. Continuar?')) return
    await clearProjects()
    reload()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">InsightLink</span>
          <span className="brand-sub">Dashboard de Desafios &amp; Projetos ENIAC Link+</span>
        </div>
        {projects.length > 0 && (
          <button className="btn-secondary" onClick={handleClearAll}>Limpar todos os dados</button>
        )}
      </header>

      <main>
        <UploadPanel onImported={reload} />

        {loading ? (
          <p className="loading">Carregando...</p>
        ) : (
          <>
            <KpiCards summary={summary} />
            <Charts summary={summary} />
            <h2 className="section-title">Registros Importados</h2>
            <ProjectsTable projects={projects} onChanged={reload} />
          </>
        )}
      </main>

      <footer className="app-footer">
        InsightLink · Ecossistema de Inovação ENIAC
      </footer>
    </div>
  )
}
