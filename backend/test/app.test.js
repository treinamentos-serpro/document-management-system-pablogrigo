const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const originalStorageDir = process.env.STORAGE_DIR;
const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;

const app = require('../src/app');
const { handleApiError } = app;

test.after(() => {
  fs.rmSync(storageDir, { recursive: true, force: true });
  if (originalStorageDir === undefined) {
    delete process.env.STORAGE_DIR;
  } else {
    process.env.STORAGE_DIR = originalStorageDir;
  }
});

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('erros internos retornam mensagem genérica e são registrados no servidor', () => {
  const loggedErrors = [];
  const originalConsoleError = console.error;
  const response = {
    headersSent: false,
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const internalError = Object.assign(
    new Error('/private/storage/document-123'),
    { code: 'EACCES' },
  );

  console.error = (...args) => loggedErrors.push(args);
  try {
    handleApiError(internalError, {}, response, () => {});
  } finally {
    console.error = originalConsoleError;
  }

  assert.strictEqual(response.statusCode, 500);
  assert.deepStrictEqual(response.body, {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocorreu um erro interno.',
    },
  });
  assert.strictEqual(JSON.stringify(response.body).includes('/private/storage'), false);
  assert.strictEqual(loggedErrors[0][1], internalError);
});

test('upload, listagem e download de documentos', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const content = 'conteúdo do documento';
    const form = new FormData();
    form.append('file', new Blob([content], { type: 'text/plain' }), 'documento.txt');

    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: form,
    });
    assert.strictEqual(uploadResponse.status, 201);

    const { document } = await uploadResponse.json();
    assert.strictEqual(document.originalName, 'documento.txt');
    assert.strictEqual(document.size, Buffer.byteLength(content));
    assert.match(document.id, /^[0-9a-f-]{36}$/i);

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(listResponse.status, 200);
    const { documents } = await listResponse.json();
    assert.strictEqual(documents.length, 1);
    assert.strictEqual(documents[0].id, document.id);
    assert.strictEqual('storageName' in documents[0], false);

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
    assert.strictEqual(downloadResponse.status, 200);
    assert.strictEqual(downloadResponse.headers.get('content-disposition'), 'attachment; filename="documento.txt"');
    assert.strictEqual(await downloadResponse.text(), content);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
