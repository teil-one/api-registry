import { JsonApiRegistry } from './JsonApiRegistry';

declare global {
  // eslint-disable-next-line no-var
  var apiRegistry: JsonApiRegistry;
}
