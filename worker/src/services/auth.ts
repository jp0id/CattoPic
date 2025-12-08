// Authentication Service
export class AuthService {
  constructor(private kv: KVNamespace) {}

  async validateApiKey(key: string): Promise<boolean> {
    if (!key) return false;

    const keysData = await this.kv.get('api_keys');
    if (!keysData) return false;

    const keys: string[] = JSON.parse(keysData);
    return keys.includes(key);
  }

  async addApiKey(key: string): Promise<void> {
    const keysData = await this.kv.get('api_keys');
    const keys: string[] = keysData ? JSON.parse(keysData) : [];

    if (!keys.includes(key)) {
      keys.push(key);
      await this.kv.put('api_keys', JSON.stringify(keys));
    }
  }

  async removeApiKey(key: string): Promise<void> {
    const keysData = await this.kv.get('api_keys');
    if (!keysData) return;

    const keys: string[] = JSON.parse(keysData);
    await this.kv.put('api_keys', JSON.stringify(keys.filter(k => k !== key)));
  }

  async listApiKeys(): Promise<string[]> {
    const keysData = await this.kv.get('api_keys');
    return keysData ? JSON.parse(keysData) : [];
  }

  // Extract API key from Authorization header
  static extractApiKey(authHeader: string | null): string | null {
    if (!authHeader) return null;

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
  }
}
