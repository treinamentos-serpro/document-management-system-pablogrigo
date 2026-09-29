import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/api.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  async function refreshDocuments() {
    setListError('');
    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setListError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function handleUpload(file) {
    const document = await uploadDocument(file);
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((item) => item.id !== document.id),
    ]);
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    try {
      const file = await downloadDocument(document.id);
      const fileUrl = URL.createObjectURL(file);
      const link = window.document.createElement('a');
      link.href = fileUrl;
      link.download = document.originalName || 'document';
      link.click();
      URL.revokeObjectURL(fileUrl);
    } finally {
      setDownloadingId('');
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">D</div>
        <div>
          <p className="eyebrow">ARQUIVO PESSOAL</p>
          <h1>Documentos</h1>
        </div>
      </header>

      <section className="workspace" aria-label="Gerenciamento de documentos">
        <div className="upload-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADICIONAR</p>
              <h2>Enviar um documento</h2>
            </div>
            <span className="file-limit">Até 10 MB</span>
          </div>
          <UploadComponent onUpload={handleUpload} />
        </div>

        <div className="list-section">
          <div className="section-heading list-heading">
            <div>
              <p className="eyebrow">BIBLIOTECA</p>
              <h2>Seus documentos</h2>
            </div>
            {!isLoading && <span className="document-count">{documents.length}</span>}
          </div>
          {listError && (
            <div className="list-error" role="alert">
              <span>{listError}</span>
              <button className="text-button" onClick={refreshDocuments} type="button">
                Tentar novamente
              </button>
            </div>
          )}
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            downloadingId={downloadingId}
            onDownload={handleDownload}
          />
        </div>
      </section>
    </main>
  );
}