import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { uploadFile } from './api';

interface UploadPanelProps {
  onImported: () => void;
}

export default function UploadPanel({ onImported }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setFeedback(null);
    let importedTotal = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await uploadFile(file);
        importedTotal += res.data.imported;
      } catch (err: any) {
        errors.push(`${file.name}: ${err.response?.data?.error || 'erro ao processar'}`);
      }
    }

    setLoading(false);
    if (importedTotal > 0) onImported();
    setFeedback({
      ok: errors.length === 0,
      message:
        errors.length === 0
          ? `${importedTotal} registro(s) importado(s) com sucesso.`
          : `${importedTotal} importado(s). Erros: ${errors.join(' | ')}`,
    });
  };

  return (
    <div
      className={`upload-panel ${dragging ? 'dragging' : ''}`}
      onDragOver={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.xlsx,.xls"
        multiple
        hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
      />
      <div className="upload-icon-pulse">
        <span className="upload-icon">📥</span>
      </div>
      <div className="upload-text-group">
        <p className="upload-title">Importar dados do ENIAC Link+</p>
        <p className="upload-hint">
          Arraste arquivos PDF ou planilhas (.xlsx) aqui, ou <span className="highlight">clique para navegar</span>
        </p>
      </div>
      {loading && <div className="upload-spinner">Processando arquivos...</div>}
      {feedback && (
        <p className={`upload-status ${feedback.ok ? 'ok' : 'error'}`}>{feedback.message}</p>
      )}
    </div>
  );
}