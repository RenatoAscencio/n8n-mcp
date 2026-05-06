"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatwootConnectionValidator = void 0;
const DEFAULT_TIMEOUT_MS = 10000;
class ChatwootConnectionValidator {
    static async testApplicationApi(baseUrl, accountId, token) {
        const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/accounts/${accountId}/conversations?page=1`;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    api_access_token: token,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (response.ok) {
                return {
                    success: true,
                    apiType: 'application',
                    message: 'Application API connection successful',
                    details: { status: response.status },
                };
            }
            const { message, suggestion } = classifyHttpStatus(response.status);
            return {
                success: false,
                apiType: 'application',
                message,
                details: { status: response.status, suggestion },
            };
        }
        catch (error) {
            const result = classifyError(error);
            result.apiType = 'application';
            return result;
        }
    }
    static async testPlatformApi(baseUrl, token) {
        const url = `${baseUrl.replace(/\/+$/, '')}/platform/api/v1/agent_bots`;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    api_access_token: token,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (response.ok) {
                return {
                    success: true,
                    apiType: 'platform',
                    message: 'Platform API connection successful',
                    details: { status: response.status },
                };
            }
            const { message, suggestion } = classifyHttpStatus(response.status);
            return {
                success: false,
                apiType: 'platform',
                message,
                details: { status: response.status, suggestion },
            };
        }
        catch (error) {
            const result = classifyError(error);
            result.apiType = 'platform';
            return result;
        }
    }
    static async testAll(config) {
        const results = [];
        if (config.token && config.accountId) {
            results.push(await this.testApplicationApi(config.baseUrl, config.accountId, config.token));
        }
        if (config.platformToken) {
            results.push(await this.testPlatformApi(config.baseUrl, config.platformToken));
        }
        return results;
    }
}
exports.ChatwootConnectionValidator = ChatwootConnectionValidator;
function classifyError(error) {
    const raw = error instanceof Error ? error.message : String(error);
    if (raw.includes('ECONNREFUSED') || raw.includes('ECONNRESET')) {
        return {
            success: false,
            apiType: 'application',
            message: 'Connection refused. The Chatwoot server is not reachable.',
            details: {
                errorType: 'network',
                suggestion: 'Verify the baseUrl and ensure the Chatwoot server is running.',
            },
        };
    }
    if (raw.includes('ENOTFOUND') || raw.includes('getaddrinfo')) {
        return {
            success: false,
            apiType: 'application',
            message: 'DNS resolution failed. The hostname could not be resolved.',
            details: {
                errorType: 'dns',
                suggestion: 'Check the baseUrl for typos in the hostname.',
            },
        };
    }
    if (raw.includes('ETIMEDOUT') || raw.includes('AbortError') || raw.includes('aborted')) {
        return {
            success: false,
            apiType: 'application',
            message: `Connection timed out after ${DEFAULT_TIMEOUT_MS}ms.`,
            details: {
                errorType: 'timeout',
                suggestion: 'The server may be slow or unreachable. Check network connectivity.',
            },
        };
    }
    if (raw.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') || raw.includes('CERT_')) {
        return {
            success: false,
            apiType: 'application',
            message: 'SSL/TLS certificate error.',
            details: {
                errorType: 'ssl',
                suggestion: 'The server has an invalid SSL certificate. Check HTTPS configuration.',
            },
        };
    }
    if (raw.includes('Invalid URL') || raw.includes('ERR_INVALID_URL')) {
        return {
            success: false,
            apiType: 'application',
            message: 'Invalid URL format.',
            details: {
                errorType: 'invalid_url',
                suggestion: 'Ensure baseUrl starts with http:// or https:// and is well-formed.',
            },
        };
    }
    const sanitized = raw
        .replace(/api_access_token[=:]\s*\S+/gi, 'api_access_token=***')
        .replace(/token[=:]\s*[A-Za-z0-9_\-]{20,}/gi, 'token=***')
        .replace(/key[=:]\s*[A-Za-z0-9_\-]{20,}/gi, 'key=***')
        .replace(/Bearer\s+\S+/gi, 'Bearer ***');
    return {
        success: false,
        apiType: 'application',
        message: `Connection failed: ${sanitized}`,
        details: { errorType: 'unknown' },
    };
}
function classifyHttpStatus(status) {
    switch (status) {
        case 401:
            return {
                message: 'Authentication failed (401 Unauthorized)',
                suggestion: 'Check your API access token.',
            };
        case 403:
            return {
                message: 'Access forbidden (403)',
                suggestion: 'The token may lack required permissions.',
            };
        case 404:
            return {
                message: 'Endpoint not found (404)',
                suggestion: 'Verify the baseUrl and accountId are correct.',
            };
        case 500:
            return {
                message: 'Server error (500)',
                suggestion: 'The Chatwoot server encountered an internal error.',
            };
        case 502:
        case 503:
        case 504:
            return {
                message: `Server unavailable (${status})`,
                suggestion: 'The Chatwoot server may be down or restarting.',
            };
        default:
            return {
                message: `Unexpected status ${status}`,
                suggestion: 'Check Chatwoot server logs for details.',
            };
    }
}
//# sourceMappingURL=connection-validator.js.map