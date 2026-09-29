const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const defaultStorageDir = path.resolve(__dirname, '../../storage');

function getStorageDir() {
  return path.resolve(process.env.STORAGE_DIR || defaultStorageDir);
}

function createDocumentRepository({ storageDir = getStorageDir() } = {}) {
  const documents = new Map();
  const resolvedStorageDir = path.resolve(storageDir);

  fs.mkdirSync(resolvedStorageDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, resolvedStorageDir),
    filename: (_request, _file, callback) => callback(null, crypto.randomUUID()),
  });

  return {
    storage,

    saveMetadata(metadata) {
      documents.set(metadata.id, { ...metadata });
      return { ...metadata };
    },

    findById(id) {
      const document = documents.get(id);
      return document ? { ...document } : null;
    },

    listByOwner(owner) {
      return [...documents.values()]
        .filter((document) => document.owner === owner)
        .sort((first, second) => {
          const dateOrder = second.uploadedAt.localeCompare(first.uploadedAt);
          return dateOrder || first.id.localeCompare(second.id);
        })
        .map((document) => ({ ...document }));
    },

    getFilePath(storageName) {
      return path.join(resolvedStorageDir, storageName);
    },

    removeFile(storageName) {
      return fs.promises.unlink(path.join(resolvedStorageDir, storageName));
    },
  };
}

const repository = createDocumentRepository();

module.exports = repository;
module.exports.createDocumentRepository = createDocumentRepository;
