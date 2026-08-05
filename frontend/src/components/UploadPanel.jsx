import { useRef, useState } from 'react'
import { uploadFile } from '../api'

export default function UploadPanel({ onImported }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    setLoading(true)
    setFeedback(null)
    let importedTotal = 0
    let errors = []

    for (const file of files) {
      try {
        const res = await uploadFile(file)
        importedTotal += res.data.imported
      } catch (err) {
        errors.push(`${file.name}: ${err.response?.data?.error || 'erro ao processar'}`)
      }
    }

    setLoading(false)
    if (importedTotal > 0) onImported()
    setFeedback({
      ok: errors.length === 0,
      message:
        errors.length === 0
          ? `${importedTotal} registro(s) importado(s) com sucesso.`
          : `${importedTotal} importado(s). Erros: ${errors.join(' | ')}`,
    })
  }

  return (
    <div
      className={`upload-panel ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.xlsx,.xls"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="upload-icon">📥</div>
      <p className="upload-title">Importar exportações do ENIAC Link+</p>
      <p className="upload-hint">
        Arraste PDFs ou planilhas (.xlsx) aqui, ou clique para selecionar
      </p>
      {loading && <p className="upload-status">Processando arquivo(s)...</p>}
      {feedback && (
        <p className={`upload-status ${feedback.ok ? 'ok' : 'error'}`}>{feedback.message}</p>
      )}
    </div>
  )
}
