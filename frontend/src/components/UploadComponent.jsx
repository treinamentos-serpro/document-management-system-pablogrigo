import { useId, useRef, useState } from 'react';

export default function UploadComponent({ onUpload }) {
  const inputId = useId();
  const formRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setMessage('');
    setError('');
    try {
      await onUpload(file);
      setFile(null);
      formRef.current?.reset();
      setMessage('Documento enviado.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit} ref={formRef}>
      <label className="file-picker" htmlFor={inputId}>
        <span className="upload-icon" aria-hidden="true">+</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Escolha um arquivo'}</strong>
          <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'ou arraste até aqui'}</span>
        </span>
        <input
          className="visually-hidden"
          id={inputId}
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setMessage('');
            setError('');
          }}
          type="file"
        />
      </label>
      <button className="primary-button" disabled={!file || isUploading} type="submit">
        {isUploading ? 'Enviando...' : 'Enviar arquivo'}
      </button>
      {message && <p className="form-message" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}