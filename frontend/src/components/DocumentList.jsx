import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading, downloadingId, onDownload }) {
  if (isLoading) {
    return <p className="list-placeholder" role="status">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return <p className="list-placeholder">Nenhum documento enviado ainda.</p>;
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <span className="document-icon" aria-hidden="true">DOC</span>
          <div className="document-info">
            <strong className="document-name" title={document.originalName}>
              {document.originalName}
            </strong>
            <span>
              {formatSize(document.size)}
              <span className="metadata-divider" aria-hidden="true"> · </span>
              {dateFormatter.format(new Date(document.uploadedAt))}
            </span>
          </div>
          <DownloadButton
            isDownloading={downloadingId === document.id}
            onDownload={() => onDownload(document)}
          />
        </li>
      ))}
    </ul>
  );
}