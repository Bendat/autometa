export class HTTPResponse<T> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  request: {
    url: string;
  };

  static fromRaw<T>(
    data: T,
    status: number,
    statusText: string,
    headers: Record<string, string>,
    url: string
  ) {
    const response = new HTTPResponse<T>();
    response.data = data;
    response.status = status;
    response.statusText = statusText;
    response.headers = headers;
    response.request = {
      url
    };
    return response;
  }
  static derive<TOriginal, TDerived>(
    original: HTTPResponse<TOriginal>,
    data: TDerived
  ): HTTPResponse<TDerived>;
  static derive<TOriginal, TDerived>(
    original: HTTPResponse<TOriginal>,
    data: (original: TOriginal) => TDerived
  ): HTTPResponse<TDerived>;
  static derive<TOriginal, TDerived>(
    original: HTTPResponse<TOriginal>,
    data: TDerived | ((original: TOriginal) => TDerived)
  ) {
    const response = new DerivedHTTPResponse<TDerived, TOriginal>();
    if (typeof data === "function") {
      const fn = data as (original: TOriginal) => TDerived;
      response.data = fn(original.data);
    } else {
      response.data = data;
    }
    response.status = original.status;
    response.statusText = original.statusText;
    response.headers = original.headers;
    response.request = original.request;
    response.actual = original as HTTPResponse<TOriginal>;
    return response;
  }
}

export class DerivedHTTPResponse<T, K> extends HTTPResponse<T> {
  actual: HTTPResponse<K>;
}
