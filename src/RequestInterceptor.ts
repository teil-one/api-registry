export type RequestInterceptor = (request: Request, next: () => Promise<Response>) => Promise<Response>;
