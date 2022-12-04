class Registry {
  public api(name: string, baseUrl?: string, headers?: { [key: string]: string }): Api {
    return new Api();
  }
}

class Api {
  public endpoint<T, TResult>(url: string, method: string, ttl: number): (param: T) => Promise<TResult> {
    const endpointId = url;
    const result = (
      this.request as (...args: Parameters<(endpointId: string, param: T) => Promise<TResult>>) => Promise<TResult>
    ).bind(this, endpointId);

    return result;
  }

  private async request<T extends Object, TResult extends Object>(endpointId: string, param: T): Promise<TResult> {
    const result: Promise<TResult> = Promise.resolve({ foo: 'bar' } as any);
    return await result;
  }
}

const ApiRegistry = new Registry();

export { ApiRegistry };
