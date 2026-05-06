import { McpToolResponse } from '../types/n8n-api';
import { InstanceContext } from '../types/instance-context';
interface ChatwootDoctorArgs {
    chatwootBaseUrl?: string;
    chatwootAccountId?: string;
    chatwootToken?: string;
    verbose?: boolean;
}
export declare function handleChatwootDoctor(args: ChatwootDoctorArgs, context?: InstanceContext): Promise<McpToolResponse>;
export {};
//# sourceMappingURL=handlers-chatwoot.d.ts.map