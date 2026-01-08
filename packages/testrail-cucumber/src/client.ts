import { Buffer } from "node:buffer";

export interface TestRailCredentials {
  readonly url: string;
  readonly username: string;
  readonly password: string;
}

export interface TestRailProject {
  readonly id: number;
  readonly name: string;
  readonly suite_mode: number;
}

export interface TestRailSuite {
  readonly id: number;
  readonly name: string;
  readonly project_id: number;
}

export interface TestRailClient {
  getProject(projectId: number): Promise<TestRailProject>;
  getSuites(projectId: number): Promise<TestRailSuite[]>;
  addSuite(projectId: number, payload: { readonly name: string; readonly description?: string }): Promise<TestRailSuite>;
}

export class HttpTestRailClient implements TestRailClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(private readonly credentials: TestRailCredentials) {
    this.baseUrl = credentials.url.replace(/\/$/, "");
    const raw = `${credentials.username}:${credentials.password}`;
    this.authHeader = `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
  }

  async getProject(projectId: number): Promise<TestRailProject> {
    return this.getJson(`/index.php?/api/v2/get_project/${projectId}`);
  }

  async getSuites(projectId: number): Promise<TestRailSuite[]> {
    return this.getJson(`/index.php?/api/v2/get_suites/${projectId}`);
  }

  async addSuite(projectId: number, payload: { readonly name: string; readonly description?: string }): Promise<TestRailSuite> {
    return this.postJson(`/index.php?/api/v2/add_suite/${projectId}`, payload);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------
  private async getJson<T>(path: string): Promise<T> {
    const response = await fetch(this.baseUrl + path, {
      method: "GET",
      headers: this.headers(),
    });
    return this.parseJson<T>(response, `GET ${path}`);
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(this.baseUrl + path, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.parseJson<T>(response, `POST ${path}`);
  }

  private headers(): Record<string, string> {
    return {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
    };
  }

  private async parseJson<T>(response: Response, label: string): Promise<T> {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`[testrail] ${label} failed (${response.status}): ${text}`);
    }
    return (await response.json()) as T;
  }
}
