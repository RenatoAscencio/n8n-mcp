# Workflow Builder Rules - MCP-First

> Reglas obligatorias para construir workflows n8n usando el MCP.
> Estas reglas aplican a Claude Code cuando actua como "n8n Workflow Builder".

## Regla 1: Consultar MCP antes de escribir JSON

**Antes de construir CUALQUIER workflow**:

1. `search_nodes` para confirmar el nombre exacto del tipo de nodo
2. `get_node` con `detail: "full"` para obtener schema, operations, required fields
3. Si el nodo es Chatwoot: `chatwoot_doctor` para verificar salud de la integracion
4. Construir el workflow JSON con los datos reales del MCP
5. `validate_workflow` antes de entregar al usuario

**Nunca inventar propiedades o nombres de nodos de memoria.**

## Regla 2: Chatwoot - Configuracion obligatoria

Para cualquier workflow que use Chatwoot:

- **Nodo type**: `@renatoascencio/n8n-nodes-chatwoot.chatwoot`
- **NO crear credenciales nuevas**: referenciar las existentes en n8n
- **account_id**: `4` (TVPlus)
- **inbox_id**: `11` (Telegram, cuando aplique)
- **Evitar operaciones destructivas** (delete) salvo solicitud explicita
- **content_attributes.source = "n8n_bot"** en mensajes enviados (anti-loop)

### Credenciales existentes en n8n

Las credenciales de Chatwoot ya estan configuradas en la instancia n8n.
Al crear un workflow, usar la referencia de credencial existente:

```json
{
  "credentials": {
    "chatwootApi": {
      "id": "CREDENTIAL_ID",
      "name": "Chatwoot API"
    }
  }
}
```

**Para obtener el ID real**: inspeccionar el workflow activo `jVMx0VfdAia4W85w`.

## Regla 3: TVPlus - Activacion manual

**PROHIBIDO** automatizar activaciones de suscripciones IPTV.
Si un workflow se relaciona con activacion:
- Solo puede crear una solicitud pendiente (task)
- Solo puede notificar al admin
- Solo puede escalar la conversacion

## Regla 4: Validacion pre-entrega

Todo workflow DEBE pasar por `validate_workflow` antes de ser entregado.
Si hay errores, corregir y re-validar hasta que pase.

Si el workflow ya fue importado a n8n, usar `n8n_validate_workflow` con el ID.

## Regla 5: Estructura minima de un workflow

```json
{
  "name": "Nombre descriptivo",
  "nodes": [
    {
      "id": "uuid-unico",
      "name": "Nombre del nodo",
      "type": "tipo.exacto.del.mcp",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": {}
    }
  ],
  "connections": {},
  "settings": {
    "executionOrder": "v1"
  }
}
```

## Regla 6: Naming convention

- **Workflow name**: `TVPlus - [Descripcion]` o `[Modulo] - [Accion]`
- **Node names**: descriptivos, en ingles, sin prefijos redundantes
- **Tags**: usar `tvplus` para identificar workflows del proyecto

---

## Plantilla de solicitud de workflow

Cuando el usuario pida un workflow, DEBE seguir este proceso:

```
SOLICITUD: [descripcion del workflow]

PASO 1 - DISCOVERY (MCP):
- [ ] search_nodes para cada tipo de nodo necesario
- [ ] get_node (detail: full) para campos requeridos
- [ ] chatwoot_doctor si involucra Chatwoot

PASO 2 - DISEÑO:
- [ ] Listar nodos con tipo exacto y version
- [ ] Definir conexiones
- [ ] Identificar credenciales necesarias (existentes)

PASO 3 - CONSTRUCCION:
- [ ] Generar JSON del workflow
- [ ] validate_workflow

PASO 4 - DEPLOY:
- [ ] n8n_create_workflow
- [ ] n8n_validate_workflow (por ID)
- [ ] Verificar en n8n UI

PASO 5 - TEST:
- [ ] n8n_test_workflow (si tiene trigger compatible)
- [ ] Documentar resultado
```

## Referencia rapida - Nodos comunes TVPlus

| Uso | Tipo de nodo | Package |
|-----|-------------|---------|
| Chatwoot ops | `@renatoascencio/n8n-nodes-chatwoot.chatwoot` | fork propio |
| HTTP Request | `n8n-nodes-base.httpRequest` | core |
| Webhook trigger | `n8n-nodes-base.webhook` | core |
| Codigo JS | `n8n-nodes-base.code` | core |
| Condicional | `n8n-nodes-base.if` | core |
| Switch | `n8n-nodes-base.switch` | core |
| Set data | `n8n-nodes-base.set` | core |
| NoOp (terminal) | `n8n-nodes-base.noOp` | core |
| Respond webhook | `n8n-nodes-base.respondToWebhook` | core |
| Schedule | `n8n-nodes-base.scheduleTrigger` | core |

## Herramientas MCP disponibles

| Herramienta | Uso |
|-------------|-----|
| `search_nodes` | Buscar nodos por keyword |
| `get_node` | Schema completo de un nodo |
| `validate_node` | Validar config de un nodo |
| `validate_workflow` | Validar workflow JSON |
| `n8n_create_workflow` | Crear workflow en n8n |
| `n8n_get_workflow` | Obtener workflow por ID |
| `n8n_update_partial_workflow` | Update incremental |
| `n8n_validate_workflow` | Validar workflow existente |
| `n8n_test_workflow` | Ejecutar/probar workflow |
| `n8n_autofix_workflow` | Auto-fix errores comunes |
| `chatwoot_doctor` | Diagnostico Chatwoot |
| `n8n_health_check` | Health check n8n API |
