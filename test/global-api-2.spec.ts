import { JsonApiRegistry } from '../src/JsonApiRegistry';

describe('Given globalThis.apiRegistry is set', () => {
  const existingRegistry = new JsonApiRegistry();
  beforeEach(async () => {
    globalThis.apiRegistry = existingRegistry;
  });

  describe('When the module is imported', () => {
    let registry: unknown;
    beforeEach(async () => {
      const module = await import('../src');
      registry = module.JsonApiRegistry;
    });

    test('Then the registry is the same object', () => {
      expect(registry).toBe(existingRegistry);
    });
  });
});
