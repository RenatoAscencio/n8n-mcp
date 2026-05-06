export interface ConnectionTestResult {
    success: boolean;
    apiType: 'application' | 'platform' | 'public';
    message: string;
    details?: Record<string, unknown>;
}
export declare class ChatwootConnectionValidator {
    static testApplicationApi(baseUrl: string, accountId: string | number, token: string): Promise<ConnectionTestResult>;
    static testPlatformApi(baseUrl: string, token: string): Promise<ConnectionTestResult>;
    static testAll(config: {
        baseUrl: string;
        accountId?: string | number;
        token?: string;
        platformToken?: string;
    }): Promise<ConnectionTestResult[]>;
}
//# sourceMappingURL=connection-validator.d.ts.map