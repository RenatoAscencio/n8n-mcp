/**
 * Chatwoot Connection Validator
 *
 * Validates connectivity to a Chatwoot instance by making test API calls.
 * Used to verify credentials before creating workflows.
 */

export interface ConnectionTestResult {
  success: boolean;
  apiType: 'application' | 'platform' | 'public';
  message: string;
  details?: Record<string, unknown>;
}

export class ChatwootConnectionValidator {
  /**
   * Test Application API connectivity
   */
  static async testApplicationApi(
    baseUrl: string,
    accountId: string | number,
    token: string,
  ): Promise<ConnectionTestResult> {
    const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/accounts/${accountId}/conversations?page=1`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          api_access_token: token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          success: true,
          apiType: 'application',
          message: 'Application API connection successful',
          details: { status: response.status },
        };
      }

      return {
        success: false,
        apiType: 'application',
        message: `Application API returned ${response.status}: ${response.statusText}`,
        details: { status: response.status },
      };
    } catch (error) {
      return {
        success: false,
        apiType: 'application',
        message: `Connection failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Test Platform API connectivity
   */
  static async testPlatformApi(
    baseUrl: string,
    token: string,
  ): Promise<ConnectionTestResult> {
    const url = `${baseUrl.replace(/\/+$/, '')}/platform/api/v1/agent_bots`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          api_access_token: token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          success: true,
          apiType: 'platform',
          message: 'Platform API connection successful',
          details: { status: response.status },
        };
      }

      return {
        success: false,
        apiType: 'platform',
        message: `Platform API returned ${response.status}: ${response.statusText}`,
        details: { status: response.status },
      };
    } catch (error) {
      return {
        success: false,
        apiType: 'platform',
        message: `Connection failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Test all APIs and return a summary
   */
  static async testAll(config: {
    baseUrl: string;
    accountId?: string | number;
    token?: string;
    platformToken?: string;
  }): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    if (config.token && config.accountId) {
      results.push(
        await this.testApplicationApi(config.baseUrl, config.accountId, config.token),
      );
    }

    if (config.platformToken) {
      results.push(
        await this.testPlatformApi(config.baseUrl, config.platformToken),
      );
    }

    return results;
  }
}
