import { JsonApi } from './JsonApi';
import { JsonApiRegistry as JsonRegistry } from './JsonApiRegistry';
import { JsonEndpoint } from './JsonEndpoint';
import { JsonResponseError } from './JsonResponseError';
import { RequestOptions } from './RequestOptions';

const JsonApiRegistry = new JsonRegistry();

export { JsonApiRegistry, JsonApi, JsonEndpoint, RequestOptions, JsonResponseError };
