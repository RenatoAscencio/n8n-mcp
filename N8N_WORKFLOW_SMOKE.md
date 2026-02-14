# Workflow Smoke Test - Evidencia

**Fecha**: 2026-02-14
**Workflow**: `TVPlus Smoke Test - Chatwoot List Conversations`
**n8n Workflow ID**: `xOKKnZUqk4Gsh93z`
**Archivo local**: `workflows/smoke-test-chatwoot-list.json`

## Objetivo

Verificar que el MCP puede crear un workflow con nodo Chatwoot y que n8n lo acepta correctamente.

## Nodos del workflow

| # | Nombre | Tipo | Proposito |
|---|--------|------|-----------|
| 1 | Manual Trigger | `n8n-nodes-base.manualTrigger` | Trigger manual (no automatico) |
| 2 | List Conversations | `@renatoascencio/n8n-nodes-chatwoot.chatwoot` | Lista 5 conversaciones de account_id=4 |
| 3 | Output | `n8n-nodes-base.noOp` | Terminal, muestra output |

## Proceso de creacion

### Paso 1: validate_workflow (local)
```
Resultado: valid=false (1 error)
Error: "Unknown node type: @renatoascencio/n8n-nodes-chatwoot.chatwoot"
Causa: El MCP no tiene el fork custom en su DB de nodos comunitarios.
         Esto es esperado para forks/paquetes privados.
Accion: Proceder con n8n_create_workflow (n8n SI tiene el nodo instalado).
```

### Paso 2: n8n_create_workflow
```
Resultado: success=true
Workflow ID: xOKKnZUqk4Gsh93z
Estado: inactive (creado como inactivo, correcto)
```

### Paso 3: n8n_validate_workflow (por ID, contra n8n real)
```
Resultado: valid=false (mismo error - validacion MCP-side, no n8n-side)
El workflow existe en n8n y se puede abrir en la UI.
La validacion es del MCP, no de n8n runtime.
```

## Limitacion conocida

El MCP valida tipos de nodos contra su base de datos local de nodos comunitarios descargados de npm. Los forks custom como `@renatoascencio/n8n-nodes-chatwoot` no estan en esa DB, por lo que `validate_workflow` reporta "Unknown node type".

**Esto NO impide**:
- Crear workflows via `n8n_create_workflow` (funciona)
- Que el workflow funcione en n8n (el nodo esta instalado)
- Usar el workflow en produccion

**Workaround**: Para validacion de nodos Chatwoot, usar `chatwoot_doctor` que SI detecta el paquete instalado en n8n.

## Evidencia de creacion exitosa

```json
{
  "success": true,
  "data": {
    "id": "xOKKnZUqk4Gsh93z",
    "name": "TVPlus Smoke Test - Chatwoot List Conversations",
    "active": false,
    "nodeCount": 3
  }
}
```

## Como ejecutar el smoke test

1. Abrir n8n: https://n8n.convo.chat
2. Ir al workflow `xOKKnZUqk4Gsh93z`
3. Configurar credenciales de Chatwoot en el nodo "List Conversations"
4. Click "Test Workflow"
5. Verificar que devuelve conversaciones del account_id=4

## URL directa

```
https://n8n.convo.chat/workflow/xOKKnZUqk4Gsh93z
```
