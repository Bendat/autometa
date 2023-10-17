
export class HTTPResponse<T> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}
