import { ChatwootWorkflowTemplate } from './workflow-templates';
import { ConnectionTestResult } from './connection-validator';
export interface ChatwootConfig {
    baseUrl?: string;
    accountId?: string | number;
    token?: string;
    platformToken?: string;
    inboxIdentifier?: string;
}
export declare class ChatwootIntegration {
    private static readonly PACKAGE_NAME;
    private static readonly NODE_TYPE;
    private static readonly TRIGGER_TYPE;
    static getInstallationGuide(): string;
    static listTemplates(): {
        id: string;
        name: string;
        description: string;
        category: string;
        difficulty: string;
    }[];
    static getTemplate(templateId: string): ChatwootWorkflowTemplate | undefined;
    static getTemplatesByCategory(category: string): ChatwootWorkflowTemplate[];
    static validateConnection(config: ChatwootConfig): Promise<ConnectionTestResult[]>;
    static isUsedInWorkflow(workflow: Record<string, unknown>): boolean;
    static getNodeTypes(): {
        main: string;
        trigger: string;
    };
    static getPackageName(): string;
    static getCapabilitiesSummary(): string;
}
//# sourceMappingURL=chatwoot-integration.d.ts.map