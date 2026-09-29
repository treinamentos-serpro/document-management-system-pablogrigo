const multer = require('multer');

const repository = require('../repositories/document.repository');
const { createDocumentService } = require('../services/document.service');
const { createDocumentController } = require('../controllers/document.controller');

const maxFileSize = getMaxFileSize();
const upload = multer({
  storage: repository.storage,
  limits: { fileSize: maxFileSize, files: 1 },
});
const service = createDocumentService(repository);
const controller = createDocumentController(service);

function createDocumentRoutes() {
  return {
    upload: [upload.single('file'), controller.upload],
    list: controller.list,
    download: controller.download,
  };
}

function getMaxFileSize() {
  const configuredSize = Number(process.env.MAX_FILE_SIZE_BYTES || 10485760);
  return Number.isInteger(configuredSize) && configuredSize > 0 ? configuredSize : 10485760;
}

module.exports = {
  createDocumentRoutes,
  uploadMiddleware: upload,
  documentController: controller,
};
