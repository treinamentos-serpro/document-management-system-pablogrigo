// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const { createDocumentRoutes } = require('./routes/document.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const documentRoutes = createDocumentRoutes();
app.post('/upload', ...documentRoutes.upload);
app.get('/documents', documentRoutes.list);
app.get('/documents/:id/download', documentRoutes.download);

const publicServerErrors = {
  UPLOAD_FAILED: 'Não foi possível salvar o documento.',
  DOCUMENT_LIST_FAILED: 'Não foi possível listar os documentos.',
  DOWNLOAD_FAILED: 'Não foi possível baixar o documento.',
};

function handleApiError(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const tooManyFiles = error.code === 'LIMIT_UNEXPECTED_FILE';
    return response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error: {
        code: error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : (tooManyFiles ? 'TOO_MANY_FILES' : 'FILE_REQUIRED'),
        message: error.code === 'LIMIT_FILE_SIZE'
          ? 'O arquivo excede o tamanho máximo permitido.'
          : (tooManyFiles ? 'Envie apenas um arquivo.' : 'Envie um arquivo no campo file.'),
      },
    });
  }

  const statusByCode = {
    DOCUMENT_NOT_FOUND: 404,
    FILE_REQUIRED: 400,
  };
  const status = error.status || statusByCode[error.code] || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error('Erro interno ao processar requisição:', error);
  }

  const knownServerError = publicServerErrors[error.code];
  const code = isServerError
    ? (knownServerError ? error.code : 'INTERNAL_SERVER_ERROR')
    : (error.code || 'UPLOAD_FAILED');
  const message = isServerError
    ? (knownServerError || 'Ocorreu um erro interno.')
    : (status === 404 ? 'Documento não encontrado.' : error.message);
  return response.status(status).json({ error: { code, message } });
}

app.use(handleApiError);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.handleApiError = handleApiError;
