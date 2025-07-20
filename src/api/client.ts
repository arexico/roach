import type { ASNResponse, PrefixResponse } from "@/types/api.ts";

const BASE_URL = 'https://irrexplorer.nlnog.net/api/prefixes';

export class IRRExplorerClient {
  private async fetchData<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Query timed out after 10 seconds. The query might return too many results.');
      }
      throw error;
    }
  }

  async getASNData(asn: string): Promise<ASNResponse> {
    // Remove AS prefix if present
    const cleanASN = asn.replace(/^AS/i, '');
    const url = `${BASE_URL}/asn/AS${cleanASN}`;
    return this.fetchData<ASNResponse>(url);
  }

  async getPrefixData(prefix: string): Promise<PrefixResponse> {
    const url = `${BASE_URL}/prefix/${encodeURIComponent(prefix)}`;
    return this.fetchData<PrefixResponse>(url);
  }
}

export const apiClient = new IRRExplorerClient();