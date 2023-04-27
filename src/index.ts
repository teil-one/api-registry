import { JsonApi } from './JsonApi';
import { JsonApiRegistry as JsonRegistry } from './JsonApiRegistry';
import { JsonEndpoint } from './JsonEndpoint';
import { JsonResponse } from './JsonResponse';
import { JsonResponseError } from './JsonResponseError';
import { RequestInterceptor } from './RequestInterceptor';
import { RequestOptions } from './RequestOptions';

const JsonApiRegistry = globalThis.apiRegistry ?? new JsonRegistry();
globalThis.apiRegistry = JsonApiRegistry;

export { JsonApiRegistry, JsonApi, JsonEndpoint, RequestOptions, RequestInterceptor, JsonResponse, JsonResponseError };
