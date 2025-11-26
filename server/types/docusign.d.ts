/**
 * TypeScript declarations for DocuSign eSign package
 * Addresses the missing type definitions
 */

declare module 'docusign-esign' {
  export class ApiClient {
    constructor();
    setBasePath(path: string): void;
    addDefaultHeader(name: string, value: string): void;
    requestJWTUserToken(
      integrationKey: string,
      userId: string,
      scopes: string[],
      rsaKey: string,
      expiresIn: number
    ): Promise<{
      body?: {
        access_token?: string;
      };
    }>;
  }

  export interface EnvelopeDefinition {
    emailSubject?: string;
    status?: string;
    documents?: unknown[];
    recipients?: unknown;
    [key: string]: unknown;
  }

  export interface RecipientViewRequest {
    authenticationMethod?: string;
    clientUserId?: string;
    email?: string;
    returnUrl?: string;
    userName?: string;
    [key: string]: unknown;
  }

  export class EnvelopesApi {
    constructor(apiClient: ApiClient);
    createEnvelope(
      accountId: string,
      envelopeDefinition: { envelopeDefinition: EnvelopeDefinition }
    ): Promise<{
      envelopeId?: string;
    }>;
    createRecipientView(
      accountId: string,
      envelopeId: string,
      recipientViewRequest: { recipientViewRequest: RecipientViewRequest }
    ): Promise<{
      url?: string;
    }>;
    getDocument(
      accountId: string,
      envelopeId: string,
      documentId: string
    ): Promise<Buffer>;
  }
}
