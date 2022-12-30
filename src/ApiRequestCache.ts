export type ApiRequestCache = Map<string, { expires: Number; response: Promise<Response> }>;
