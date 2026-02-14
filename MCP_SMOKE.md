# MCP Smoke Test - TVPlus IPTV

**Fecha**: 2026-02-14
**MCP Version**: n8n-documentation-mcp v2.35.2
**Imagen Docker**: `ghcr.io/renatoascencio/n8n-mcp:latest`

## 1. Verificacion de conectividad

**Comando ejecutado** (sin secretos):
```bash
(printf '<initialize_request>\n<tools/call search_nodes chatwoot>\n'; sleep 15) \
  | docker run -i --rm --init --no-healthcheck \
    -e MCP_MODE=stdio \
    -e LOG_LEVEL=error \
    -e DISABLE_CONSOLE_OUTPUT=true \
    -e N8N_API_URL=https://n8n.convo.chat \
    -e "N8N_API_KEY=$N8N_API_KEY" \
    ghcr.io/renatoascencio/n8n-mcp:latest
```

**Resultado**: OK - MCP inicializa y responde tools/list con 21 herramientas.

## 2. search_nodes("chatwoot")

**Resultados** (3 paquetes en la base de datos del MCP):

| # | nodeType | displayName | package | author |
|---|----------|-------------|---------|--------|
| 1 | `n8n-nodes-chatwoot.chatwoot` | chatwoot | n8n-nodes-chatwoot | hugodeco |
| 2 | `@pixelinfinito/n8n-nodes-chatwoot.chatwoot` | chatwoot | @pixelinfinito/n8n-nodes-chatwoot | mctlisboa |
| 3 | `@devlikeapro/n8n-nodes-chatwoot.chatwoot` | chatwoot | @devlikeapro/n8n-nodes-chatwoot | devlikeapro |

**Nota**: El paquete instalado en nuestro n8n es `@renatoascencio/n8n-nodes-chatwoot` (fork propio). El MCP no lo tiene en su DB local de nodos comunitarios, pero sí lo detecta vía `chatwoot_doctor`.

## 3. chatwoot_doctor (verbose)

**Comando**: `chatwoot_doctor` con `verbose: true`

**Resultados**:

| Check | Estado |
|-------|--------|
| MCP Server | v2.35.2, Docker, stdio, Node v22.22.0 |
| n8n API | Conectado, URL: `https://n8n.convo.chat` |
| Chatwoot Node | `@renatoascencio/n8n-nodes-chatwoot` detectado |
| Templates | 5/5 disponibles, healthy |
| Summary | healthy, 0 issues, 494ms |

**Capabilities del nodo Chatwoot**:
- **Resources**: 27
- **Operations**: 130+
- **API Types**: 3 (Application, Platform, Public)
- **Application API** (20 resources): Account, Agent, Agent Bot, Audit Log, Automation Rule, Canned Response, Contact, Conversation, CSAT Survey, Custom Attribute, Custom Filter, Help Center, Inbox, Integration, Label, Message, Profile, Report, Team, Webhook
- **Platform API** (4 resources): Platform Account, Platform User, Account User, Account Agent Bot
- **Public API** (3 resources): Public Contact, Public Conversation, Public Message
- Features: Real-time webhook trigger, dynamic dropdowns, smart pagination, 3 credential types

## 4. n8n_list_workflows

**Resultado**: 3 workflows encontrados

| ID | Nombre | Active | Nodes |
|----|--------|--------|-------|
| `6rAHNGE8bY7fHAcy` | Chat 47e71cc4... | false (archived) | 7 |
| `jVMx0VfdAia4W85w` | TVPlus Bot - Chatwoot Integration | **true** | 13 |
| `q3GMaeborpCKPROS` | Chatbot Punto A - Sistema Completo | false | 28 |

## 5. n8n_get_workflow (TVPlus Bot - structure)

**Workflow activo**: `jVMx0VfdAia4W85w` - 13 nodos, 9 conexiones

Nodos Chatwoot en uso:
- `Send Reply` - type: `@renatoascencio/n8n-nodes-chatwoot.chatwoot`
- `Assign Agent` - type: `@renatoascencio/n8n-nodes-chatwoot.chatwoot`
- `Add Context Note` - type: `@renatoascencio/n8n-nodes-chatwoot.chatwoot`

## 6. Herramientas MCP disponibles (21 tools)

### Documentacion y busqueda (6)
- `tools_documentation` - Docs de herramientas MCP
- `search_nodes` - Buscar nodos n8n
- `get_node` - Detalle de nodo (schema, props, operations)
- `validate_node` - Validar config de nodo
- `search_templates` - Buscar templates
- `get_template` - Obtener template

### Workflow management (8)
- `validate_workflow` - Validar workflow JSON
- `n8n_create_workflow` - Crear workflow
- `n8n_get_workflow` - Obtener workflow
- `n8n_update_full_workflow` - Update completo
- `n8n_update_partial_workflow` - Update incremental (diff ops)
- `n8n_delete_workflow` - Eliminar workflow
- `n8n_list_workflows` - Listar workflows
- `n8n_validate_workflow` - Validar workflow por ID

### Execution y deploy (4)
- `n8n_autofix_workflow` - Auto-fix errores comunes
- `n8n_test_workflow` - Ejecutar/probar workflow
- `n8n_executions` - Gestionar ejecuciones
- `n8n_deploy_template` - Deploy template de n8n.io

### Diagnostico (2)
- `n8n_health_check` - Health check de n8n
- `chatwoot_doctor` - Diagnostico integracion Chatwoot

### Versionado (1)
- `n8n_workflow_versions` - Historial, rollback, prune

## Conclusion

El MCP esta operativo, conectado a n8n, detecta el nodo Chatwoot `@renatoascencio/n8n-nodes-chatwoot`, y tiene 21 herramientas disponibles para gestionar workflows programaticamente.
