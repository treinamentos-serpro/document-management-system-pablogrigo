const crypto = require('node:crypto');

const DEFAULT_OWNER = process.env.DMS_DEFAULT_OWNER_ID || 'local';

class DocumentServiceError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'DocumentServiceError';
    this.code = code;
    this.cause = cause;
  }
}

function createDocumentService(repository, { owner = DEFAULT_OWNER } = {}) {
  return {
    async upload(file) {
      if (!file) {
        throw new DocumentServiceError('FILE_REQUIRED', 'Envie um arquivo no campo file.');
      }

      const metadata = {
        id: crypto.randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        storageName: file.filename,
        mimeType: file.mimetype,
      };

      try {
        repository.saveMetadata(metadata);
      } catch (error) {
        await repository.removeFile(file.filename).catch(() => {});
        throw new DocumentServiceError('UPLOAD_FAILED', 'Não foi possível salvar o documento.', error);
      }

      return toPublicMetadata(metadata);
    },

    list() {
      try {
        return repository.listByOwner(owner).map(toPublicMetadata);
      } catch (error) {
        throw new DocumentServiceError('DOCUMENT_LIST_FAILED', 'Não foi possível listar os documentos.', error);
      }
    },

    getDownload(id) {
      const document = repository.findById(id);
      if (!document || document.owner !== owner) {
        throw new DocumentServiceError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      return {
        ...document,
        filePath: repository.getFilePath(document.storageName),
      };
    },
  };
}

function toPublicMetadata(document) {
  const { storageName, mimeType, ...publicMetadata } = document;
  return publicMetadata;
}

module.exports = {
  DocumentServiceError,
  createDocumentService,
};
