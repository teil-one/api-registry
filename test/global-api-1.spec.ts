describe('Given the module is not imported', () => {
  test('Then globalThis.apiRegistry is not set', () => {
    expect(globalThis.apiRegistry).toBeFalsy();
  });

  describe('When the module is imported', () => {
    let registry: unknown;
    beforeEach(async () => {
      const module = await import('../src');
      registry = module.JsonApiRegistry;
    });

    test('Then globalThis.apiRegistry is set', () => {
      expect(globalThis.apiRegistry).toBe(registry);
    });
  });
});
