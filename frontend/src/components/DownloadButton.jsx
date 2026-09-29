import { useState } from 'react';

export default function DownloadButton({ isDownloading, onDownload }) {
  const [error, setError] = useState('');

  async function handleClick() {
    setError('');
    try {
      await onDownload();
    } catch (downloadError) {
      setError(downloadError.message);
    }
  }

  return (
    <span className="download-control">
      <button
        aria-label={isDownloading ? 'Baixando documento' : 'Baixar documento'}
        className="download-button"
        disabled={isDownloading}
        onClick={handleClick}
        title="Baixar documento"
        type="button"
      >
        {isDownloading ? '...' : '↓'}
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </span>
  );
}