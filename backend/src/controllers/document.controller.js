const fs = require('node:fs');
const path = require('node:path');

function createDocumentController(service) {
  return {
    upload: async (request, response, next) => {
      try {
        const document = await service.upload(request.file);
        response.status(201).json({ document });
      } catch (error) {
        next(error);
      }
    },

    list: (request, response, next) => {
      try {
        response.json({ documents: service.list() });
      } catch (error) {
        next(error);
      }
    },

    download: async (request, response, next) => {
      try {
        if (!isUuid(request.params.id)) {
          return next(httpError(400, 'INVALID_DOCUMENT_ID', 'O identificador do documento é inválido.'));
        }

        const document = service.getDownload(request.params.id);
        const fileName = sanitizeFileName(document.originalName);
        const fileStats = await fs.promises.stat(document.filePath);

        response.setHeader('Content-Type', 'application/octet-stream');
        response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        response.setHeader('Content-Length', fileStats.size);
        response.setHeader('X-Content-Type-Options', 'nosniff');

        const stream = fs.createReadStream(document.filePath);
        stream.on('error', (error) => next(httpError(500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.', error)));
        stream.pipe(response);
      } catch (error) {
        next(error.code === 'ENOENT'
          ? httpError(500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.', error)
          : error);
      }
    },
  };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function sanitizeFileName(originalName) {
  const baseName = path.basename(originalName || 'documento');
  return baseName.replace(/[\r\n"\\]/g, '_') || 'documento';
}

function httpError(status, code, message, cause) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.cause = cause;
  return error;
}

module.exports = {
  createDocumentController,
};
