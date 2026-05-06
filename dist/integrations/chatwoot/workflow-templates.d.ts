export interface ChatwootWorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: 'contact-sync' | 'messaging' | 'monitoring' | 'automation';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    requiredCredential: 'chatwootApi' | 'chatwootPlatformApi' | 'chatwootPublicApi';
    workflow: Record<string, unknown>;
}
export declare const CHATWOOT_WORKFLOW_TEMPLATES: ChatwootWorkflowTemplate[];
//# sourceMappingURL=workflow-templates.d.ts.map