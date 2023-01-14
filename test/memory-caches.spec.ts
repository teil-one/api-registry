import { jest } from '@jest/globals';

describe('global.caches is defined, but running not in a secure context', () => {
  beforeEach(() => {
    global.caches = {} as any;

    console.warn = jest.fn();
  });

  describe('api-registry is used', () => {
    beforeEach(async () => {
      const { JsonApiRegistry } = await import('../src');
      JsonApiRegistry.api('test-api', 'http://foo.bar').endpoint('api');
      JsonApiRegistry.api('test-api', 'http://foo.bar').endpoint('api2');
      JsonApiRegistry.api('test-api2', 'http://foo2.bar').endpoint('api');
    });

    test('A warning is shown', () => {
      expect(console.warn).toHaveBeenNthCalledWith(
        1,
        'Non-secure context. Memory cache will be used instead of Cache API'
      );
    });
  });
});
