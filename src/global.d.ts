import { JsonApiRegistry } from './JsonApiRegistry';

declare global {
  // eslint-disable-next-line no-var
  var apiRegistryV2: JsonApiRegistry; // Must contain the major version number to avoid compatibility issues
}
