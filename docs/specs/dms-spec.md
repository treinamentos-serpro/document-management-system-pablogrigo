# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web que permita ao usuário enviar, listar e baixar documentos, armazenando os arquivos exclusivamente no filesystem local e mantendo os metadados em memória nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário local.
- Download de um documento pelo identificador.
- Exibição dos metadados básicos do documento.
- Interface React para enviar, listar e baixar documentos.
- Tratamento consistente de erros de validação, armazenamento e documentos inexistentes.

### Fora do escopo

- Armazenamento em nuvem, serviços de terceiros ou qualquer armazenamento remoto.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Autenticação, cadastro de usuários ou autorização multiusuário nesta fase.
- Banco de dados ou persistência durável dos metadados.
- Busca, filtros, paginação, visualização/preview ou conversão de arquivos.

### Premissas e limitações

- Enquanto não houver autenticação, o sistema opera com um único usuário local. O identificador de proprietário é definido pela configuração `DMS_DEFAULT_OWNER_ID`, com valor padrão `local`; ele não é aceito da requisição do cliente. Isso não representa isolamento seguro entre usuários. Uma implementação futura de autenticação deverá obter o proprietário da identidade autenticada.
- Os metadados existem somente durante a vida do processo. Após reinício, os arquivos permanecem no disco, mas não estarão listados nem poderão ser localizados pela API sem metadados reconstruídos. Reconstrução automática não faz parte do escopo.
- As rotas abaixo são paths do backend. No frontend, são acessadas sob `/api`; o proxy Vite existente remove esse prefixo ao encaminhar ao backend.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um único arquivo em uma requisição `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema deve rejeitar a requisição quando o arquivo estiver ausente ou quando mais de um arquivo for enviado. |
| RF-03 | O sistema deve limitar o upload a 10 MiB (10.485.760 bytes); o limite deve ser configurável pela variável `MAX_FILE_SIZE_BYTES`. |
| RF-04 | Ao aceitar um upload, o sistema deve gerar um identificador único, gravar o conteúdo no armazenamento local e registrar os metadados em memória. |
| RF-05 | O sistema deve preservar o nome original apenas como metadado e nunca usá-lo como caminho/nome físico do arquivo. |
| RF-06 | O sistema deve atribuir o proprietário configurado em `DMS_DEFAULT_OWNER_ID`, sem confiar em um identificador enviado pelo cliente. |
| RF-07 | O sistema deve listar os metadados dos documentos do usuário local, ordenados do mais recente para o mais antigo; empates devem ter ordenação estável por `id`. |
| RF-08 | O sistema deve permitir baixar o conteúdo de um documento pelo `id`, retornando-o como anexo com o nome original sanitizado para uso no cabeçalho. |
| RF-09 | O sistema deve retornar `404` para identificadores inexistentes, sem revelar caminhos ou dados do filesystem. |
| RF-10 | A interface deve permitir enviar um documento, visualizar os metadados listados, exibir erros da API e iniciar o download. |
| RF-11 | A API deve retornar erros em formato JSON uniforme, exceto para respostas binárias de download bem-sucedidas. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos devem ser gravados exclusivamente no filesystem local, usando Multer `diskStorage`, por padrão em `backend/storage`. Não utilizar provedores ou serviços externos. |
| RNF-02 | Metadados devem ser mantidos em memória nesta fase; a perda de metadados após reinício é uma limitação conhecida e documentada. |
| RNF-03 | Configurações operacionais devem vir de variáveis de ambiente, com defaults seguros documentados. |
| RNF-04 | O tamanho máximo padrão de upload deve ser 10 MiB; uploads acima do limite devem ser interrompidos e respondidos com `413 Payload Too Large`. |
| RNF-05 | O nome original não deve influenciar o caminho no disco. O nome armazenado deve ser gerado pelo servidor a partir do identificador do documento. |
| RNF-06 | Erros internos não devem expor stack traces, caminhos absolutos ou detalhes sensíveis na resposta HTTP. |
| RNF-07 | O backend deve respeitar a separação `routes -> controllers -> services -> repositories`; camadas internas não devem depender de Express ou de detalhes HTTP. |
| RNF-08 | A API deve ser consumida pelo frontend via `fetch` e prefixo `/api`, conforme o proxy do Vite. |
| RNF-09 | O sistema deve aceitar formatos de arquivo genéricos nesta fase. `Content-Type` informado pelo cliente não deve ser tratado como prova de segurança ou autenticidade do conteúdo. |

### Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local para os arquivos. O valor deve resolver para um caminho local; não usar storage remoto. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Limite máximo de bytes por arquivo. Deve ser um inteiro positivo. |
| `DMS_DEFAULT_OWNER_ID` | `local` | Identificador do usuário local nesta fase sem autenticação. |

## 5. Modelo de dados (metadados do documento)

Os metadados são mantidos em uma coleção em memória no repositório. A localização física do arquivo não é exposta pela API.

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | UUID gerado pelo servidor; chave única do documento. |
| `originalName` | string | Sim | Nome original enviado pelo cliente, preservado para exibição e download, não usado como caminho no disco. |
| `size` | number | Sim | Tamanho do conteúdo em bytes, validado contra o limite configurado. |
| `uploadedAt` | string | Sim | Data/hora UTC do aceite do upload em formato ISO 8601. |
| `owner` | string | Sim | Identificador vindo de `DMS_DEFAULT_OWNER_ID`; não vem do corpo da requisição. |
| `storageName` | string | Sim | Nome interno gerado pelo servidor, baseado no UUID, usado somente pelo repositório para localizar o arquivo. Não deve ser retornado ao cliente. |
| `mimeType` | string | Sim | Tipo informado pelo parser do upload; é apenas metadado e não deve ser considerado validado ou confiável. |

Regras de integridade:

- O `id` e o `storageName` são gerados pelo servidor e não podem ser definidos pelo cliente.
- Cada documento deve ter exatamente um arquivo físico correspondente durante a vida do processo.
- Se a gravação do arquivo falhar, não deve ser criado metadado. Se o registro do metadado falhar após a gravação, o serviço deve tentar remover o arquivo recém-gravado e retornar erro interno.
- Se um arquivo registrado não existir no filesystem, o serviço deve retornar erro interno genérico, registrar o problema para diagnóstico sem expor o caminho e não enviar conteúdo parcial.

## 6. Contratos de API

### Convenções gerais

- Base path no backend: `/`. O frontend usa `/api` via proxy; por exemplo, `/api/documents` é encaminhado como `/documents`.
- Requisições e respostas de metadados usam UTF-8 e JSON, salvo upload multipart e download binário.
- Erros JSON seguem o formato `{ "error": { "code": "...", "message": "..." } }`.
- `message` é uma mensagem segura e adequada para apresentação; detalhes internos ficam somente nos logs do servidor.
- Nenhuma rota recebe `owner` do cliente. Nesta fase, todas as operações usam o proprietário local configurado.

### `POST /upload`

Envia um documento.

**Entrada**

- `Content-Type: multipart/form-data`.
- Um único campo de arquivo chamado `file`.
- `owner`, `id`, `storageName` e metadados equivalentes enviados como campos adicionais não alteram os valores definidos pelo servidor.

**Sucesso: `201 Created`**

```json
{
  "document": {
    "id": "<uuid>",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-09-29T12:00:00.000Z",
    "owner": "local"
  }
}
```

A resposta não inclui `storageName` nem caminho físico. `mimeType` pode ser mantido internamente, mas não é necessário na resposta pública.

**Erros**

| Status | Código | Quando |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Campo `file` ausente ou corpo multipart inválido. |
| `400` | `TOO_MANY_FILES` | Mais de um arquivo foi enviado. |
| `413` | `FILE_TOO_LARGE` | O arquivo excede `MAX_FILE_SIZE_BYTES`. |
| `500` | `UPLOAD_FAILED` | Falha inesperada ao gravar o arquivo ou registrar metadados. |

### `GET /documents`

Lista os metadados dos documentos do usuário local, sem retornar conteúdo ou caminhos físicos. Não recebe parâmetros de paginação/filtro nesta fase.

**Sucesso: `200 OK`**

```json
{
  "documents": [
    {
      "id": "<uuid>",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-09-29T12:00:00.000Z",
      "owner": "local"
    }
  ]
}
```

Quando não houver documentos, retorna `200` com `"documents": []`.

**Erros**

| Status | Código | Quando |
| --- | --- | --- |
| `500` | `DOCUMENT_LIST_FAILED` | Falha inesperada ao consultar metadados. |

### `GET /documents/:id/download`

Baixa o conteúdo do documento identificado por `id`.

**Sucesso: `200 OK`**

- Corpo: bytes do arquivo, sem envelope JSON.
- `Content-Type: application/octet-stream`.
- `Content-Disposition: attachment` com `originalName` sanitizado segundo as regras de cabeçalho HTTP; não concatenar entrada não confiável diretamente ao cabeçalho.
- `Content-Length` igual ao tamanho gravado, quando disponível.
- `X-Content-Type-Options: nosniff`.

**Erros**

| Status | Código | Quando |
| --- | --- | --- |
| `400` | `INVALID_DOCUMENT_ID` | `id` vazio ou em formato inválido para UUID. |
| `404` | `DOCUMENT_NOT_FOUND` | Não há metadados para o `id`. |
| `500` | `DOWNLOAD_FAILED` | Metadado existe, mas a leitura do arquivo falhou; resposta não deve revelar caminho local. |

### Códigos e mensagens de erro

Exemplo de resposta para upload ausente:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

A implementação deve mapear erros conhecidos do Multer para os códigos acima. Erros inesperados devem ser registrados no backend e convertidos para o código público correspondente, sem devolver mensagem interna ou stack trace.

## 7. Decisões arquiteturais

### Backend

- Node.js e Express em CommonJS.
- `routes/`: declara paths e encaminha requisições aos controllers.
- `controllers/`: adapta entrada e saída HTTP, valida parâmetros HTTP básicos e define status/headers.
- `services/`: aplica regras de upload/listagem/download e coordena persistência e metadados.
- `repositories/`: grava/lê/remove arquivos locais e consulta/atualiza metadados em memória.
- Multer deve ser configurado com `diskStorage`; o destino é o diretório local configurado, padrão `backend/storage`. O nome físico é gerado no servidor, sem usar `originalName`.
- O middleware de erro deve converter erros de validação/Multer em respostas HTTP uniformes.
- A rota de saúde existente (`GET /health`) deve continuar funcionando.

### Frontend

- React com componentes funcionais e Hooks, organizado em `components/`, `pages/` e `services/`.
- A camada de serviço deve chamar a API usando `fetch` sob `/api`, sem duplicar lógica de transporte nos componentes.
- A tela deve apresentar seleção de arquivo, ação de envio, estado de carregamento, feedback de erro/sucesso, listagem de metadados e ação de download.

### Persistência e segurança

- O conteúdo dos arquivos fica apenas no disco local; não adicionar integração externa.
- Metadados ficam em memória. A implementação não deve sugerir durabilidade que não existe.
- Nomes de arquivo, MIME type e demais valores recebidos do cliente são não confiáveis. O identificador e o nome físico são gerados no backend; o nome original é sanitizado antes de compor `Content-Disposition`.
- Não aceitar `owner` fornecido pelo cliente. A configuração de proprietário único é uma conveniência local, não mecanismo de autenticação.

## 8. Plano de execução

As etapas abaixo são trabalho futuro orientado por esta especificação; não fazem parte da criação deste documento.

1. Preparar configuração do backend, diretório local de storage e políticas para limite de upload, nome físico e proprietário local.
2. Implementar o repositório de metadados em memória e o repositório de arquivos locais usando Multer `diskStorage`.
3. Implementar serviços de upload, listagem e download, incluindo validações, ordenação e tratamento de falhas/arquivos órfãos.
4. Implementar controllers, rotas e middleware de erro; preservar `GET /health` e validar os contratos HTTP.
5. Criar testes backend para upload válido/inválido, limite de tamanho, listagem vazia/ordenada, download, documento inexistente e falhas de filesystem.
6. Implementar serviços de API e componentes/página React para enviar, listar e baixar documentos, com estados de carregamento e erro.
7. Validar a integração frontend-backend usando o proxy `/api`, executar testes e documentar as limitações de reinício e usuário único.
