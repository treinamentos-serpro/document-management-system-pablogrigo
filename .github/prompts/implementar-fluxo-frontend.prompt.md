---
description: Orienta a implementação incremental de mudanças na interface React do DMS.
name: implementar-fluxo-frontend
argument-hint: requisito e critérios de aceite da interface
agent: agent
---

# Implementar mudança no frontend

Implemente a mudança descrita em `${input:requisito:descreva o requisito e os critérios de aceite}`.

Antes de editar:

- Consulte as instruções do projeto e a seção pertinente de `docs/specs/dms-spec.md`.
- Leia os componentes e serviços existentes relacionados ao fluxo; localize a responsabilidade antes de escolher onde alterar.
- Compare o requisito com o comportamento atual e identifique qualquer ambiguidade relevante.

Requisitos de implementação:

- Faça a menor mudança coesa, seguindo os padrões existentes de React e reutilizando componentes e serviços adequados.
- Mantenha as chamadas ao backend em `frontend/src/services/api.js` e use o prefixo `/api` conforme o proxy do Vite.
- Preserve o contrato da API. Não assuma drag-and-drop, busca, paginação, preview ou outros recursos sem solicitação explícita.
- Trate os estados aplicáveis de carregamento, sucesso, erro e vazio sem apresentar uma falha como lista vazia ou sucesso.
- Mantenha textos apresentados ao usuário em português e controles acessíveis por teclado, com nomes e rótulos claros.
- Evite redesigns, dependências novas e infraestrutura de testes não existente, salvo quando forem necessários ao requisito.
- Se a mudança alterar o contrato ou o escopo documentado, atualize a especificação pertinente.

Validação:

- Execute `npm run build` no diretório `frontend`.
- Execute testes focados que já existam para o código alterado. Não invente um runner de testes frontend; informe quando não houver testes aplicáveis.
- Ao concluir, resuma o comportamento implementado, os arquivos alterados e as validações executadas, incluindo limitações ou decisões assumidas.