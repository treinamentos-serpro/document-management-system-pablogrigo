const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { handleApiError } = app;

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
