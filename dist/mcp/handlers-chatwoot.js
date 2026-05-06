"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChatwootDoctor = handleChatwootDoctor;
const chatwoot_1 = require("../integrations/chatwoot");
const chatwoot_2 = require("../integrations/chatwoot");
const n8n_api_1 = require("../config/n8n-api");
const version_1 = require("../utils/version");
const logger_1 = require("../utils/logger");
async function handleChatwootDoctor(args, context) {
    const startTime = Date.now();
    const report = {};
    report.server = {
        version: version_1.PROJECT_VERSION,
        isDocker: process.env.IS_DOCKER === 'true',
        mcpMode: process.env.MCP_MODE || 'stdio',
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString(),
    };
    const apiConfig = (0, n8n_api_1.getN8nApiConfig)();
    const n8nApiStatus = {
        configured: apiConfig !== null,
        baseUrl: apiConfig?.baseUrl ?? null,
    };
    if (apiConfig) {
        try {
            const { getN8nApiClient } = await Promise.resolve().then(() => __importStar(require('./handlers-n8n-manager')));
            const client = getN8nApiClient(context);
            if (client) {
                const health = await client.healthCheck();
                n8nApiStatus.connected = true;
                n8nApiStatus.n8nVersion = health.n8nVersion || 'unknown';
            }
            else {
                n8nApiStatus.connected = false;
                n8nApiStatus.error = 'Could not create API client';
            }
        }
        catch (error) {
            n8nApiStatus.connected = false;
            n8nApiStatus.error = sanitizeErrorMessage(error);
        }
    }
    report.n8nApi = n8nApiStatus;
    const nodeInstallation = {
        packageName: chatwoot_1.ChatwootIntegration.getPackageName(),
        checked: false,
    };
    if (apiConfig && n8nApiStatus.connected) {
        try {
            const { getN8nApiClient } = await Promise.resolve().then(() => __importStar(require('./handlers-n8n-manager')));
            const client = getN8nApiClient(context);
            if (client) {
                const credResponse = await client.listCredentials();
                const chatwootCreds = credResponse.data.filter((c) => c.type === 'chatwootApi' ||
                    c.type === 'chatwootPlatformApi' ||
                    c.type === 'chatwootPublicApi');
                nodeInstallation.checked = true;
                nodeInstallation.credentialsFound = chatwootCreds.length;
                nodeInstallation.credentialTypes = chatwootCreds.map((c) => ({
                    name: c.name,
                    type: c.type,
                }));
            }
        }
        catch (error) {
            nodeInstallation.checked = true;
            nodeInstallation.error = sanitizeErrorMessage(error);
        }
    }
    report.chatwootNode = nodeInstallation;
    const templates = chatwoot_1.ChatwootIntegration.listTemplates();
    report.templates = {
        available: templates.length,
        expected: 5,
        healthy: templates.length === 5,
        list: templates.map((t) => ({ id: t.id, name: t.name, category: t.category })),
    };
    if (args.chatwootBaseUrl) {
        const chatwootApi = {
            baseUrl: args.chatwootBaseUrl,
            tokenProvided: !!args.chatwootToken,
            accountIdProvided: !!args.chatwootAccountId,
        };
        if (args.chatwootToken && args.chatwootAccountId) {
            try {
                const result = await chatwoot_2.ChatwootConnectionValidator.testApplicationApi(args.chatwootBaseUrl, args.chatwootAccountId, args.chatwootToken);
                chatwootApi.applicationApi = {
                    success: result.success,
                    message: result.message,
                    ...(result.details ? { status: result.details.status } : {}),
                };
            }
            catch (error) {
                chatwootApi.applicationApi = {
                    success: false,
                    message: sanitizeErrorMessage(error),
                };
            }
        }
        else if (args.chatwootToken) {
            chatwootApi.note =
                'Provide both chatwootAccountId and chatwootToken to test Application API';
        }
        report.chatwootApi = chatwootApi;
    }
    const issues = [];
    if (!apiConfig)
        issues.push('n8n API not configured (N8N_API_URL/N8N_API_KEY missing)');
    if (apiConfig && !n8nApiStatus.connected)
        issues.push('n8n API configured but not reachable');
    if (nodeInstallation.checked &&
        nodeInstallation.credentialsFound === 0) {
        issues.push('No Chatwoot credentials found in n8n instance');
    }
    if (templates.length !== 5) {
        issues.push(`Expected 5 templates, found ${templates.length}`);
    }
    report.summary = {
        healthy: issues.length === 0,
        issueCount: issues.length,
        issues,
        responseTimeMs: Date.now() - startTime,
    };
    if (args.verbose) {
        report.debug = {
            envKeys: Object.keys(process.env).filter((k) => k.startsWith('N8N_') ||
                k.startsWith('MCP_') ||
                k.startsWith('CHATWOOT_') ||
                k === 'IS_DOCKER'),
            chatwootCapabilities: chatwoot_1.ChatwootIntegration.getCapabilitiesSummary(),
        };
    }
    logger_1.logger.info('chatwoot_doctor completed', {
        healthy: issues.length === 0,
        issueCount: issues.length,
        responseTimeMs: Date.now() - startTime,
    });
    return { success: true, data: report };
}
function sanitizeErrorMessage(error) {
    const msg = error instanceof Error ? error.message : String(error);
    return msg
        .replace(/api_access_token[=:]\s*\S+/gi, 'api_access_token=***')
        .replace(/token[=:]\s*[A-Za-z0-9_\-]{20,}/gi, 'token=***')
        .replace(/key[=:]\s*[A-Za-z0-9_\-]{20,}/gi, 'key=***')
        .replace(/Bearer\s+\S+/gi, 'Bearer ***');
}
//# sourceMappingURL=handlers-chatwoot.js.map