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

export interface TestRailSection {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly suite_id?: number;
  readonly parent_id?: number;
}

export interface TestRailCase {
  readonly id: number;
  readonly title: string;
  readonly section_id?: number;
  readonly suite_id?: number;
  readonly refs?: string;
  readonly custom_steps_separated?: readonly { readonly content?: string; readonly expected?: string }[];
  readonly custom_test_case_description?: string;
  // TestRail installations vary heavily; keep it open.
  readonly [key: string]: unknown;
}

export interface TestRailClient {
  getProject(projectId: number): Promise<TestRailProject>;
  getSuites(projectId: number): Promise<TestRailSuite[]>;
  addSuite(projectId: number, payload: { readonly name: string; readonly description?: string }): Promise<TestRailSuite>;

  getCase(caseId: number): Promise<TestRailCase>;

  getSections(projectId: number, options?: { readonly suiteId?: number }): Promise<TestRailSection[]>;
  addSection(
    projectId: number,
    payload: {
      readonly name: string;
      readonly description?: string;
      readonly suite_id?: number;
      readonly parent_id?: number;
    }
  ): Promise<TestRailSection>;

  getCases(
    projectId: number,
    options?: { readonly suiteId?: number; readonly sectionId?: number }
  ): Promise<TestRailCase[]>;
  addCase(sectionId: number, payload: Record<string, unknown>): Promise<TestRailCase>;
  updateCase(caseId: number, payload: Record<string, unknown>): Promise<TestRailCase>;
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

  async getCase(caseId: number): Promise<TestRailCase> {
    return this.getJson(`/index.php?/api/v2/get_case/${caseId}`);
  }

  async getSections(projectId: number, options: { readonly suiteId?: number } = {}): Promise<TestRailSection[]> {
    const qs = options.suiteId !== undefined ? `&suite_id=${options.suiteId}` : "";
    return this.getJson(`/index.php?/api/v2/get_sections/${projectId}${qs}`);
  }

  async addSection(
    projectId: number,
    payload: {
      readonly name: string;
      readonly description?: string;
      readonly suite_id?: number;
      readonly parent_id?: number;
    }
  ): Promise<TestRailSection> {
    return this.postJson(`/index.php?/api/v2/add_section/${projectId}`, payload);
  }

  async getCases(
    projectId: number,
    options: { readonly suiteId?: number; readonly sectionId?: number } = {}
  ): Promise<TestRailCase[]> {
    const params: string[] = [];
    if (options.suiteId !== undefined) {
      params.push(`suite_id=${options.suiteId}`);
    }
    if (options.sectionId !== undefined) {
      params.push(`section_id=${options.sectionId}`);
    }
    const qs = params.length ? `&${params.join("&")}` : "";
    return this.getJson(`/index.php?/api/v2/get_cases/${projectId}${qs}`);
  }

  async addCase(sectionId: number, payload: Record<string, unknown>): Promise<TestRailCase> {
    return this.postJson(`/index.php?/api/v2/add_case/${sectionId}`, payload);
  }

  async updateCase(caseId: number, payload: Record<string, unknown>): Promise<TestRailCase> {
    return this.postJson(`/index.php?/api/v2/update_case/${caseId}`, payload);
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
