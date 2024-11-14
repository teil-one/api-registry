import { jest } from '@jest/globals';
import { FetchProgressEvent, trackRequestProgress } from 'fetch-api-progress';
import { JsonApiRegistry } from '../../src';

describe('Upload to httpbin.org API', () => {
  const api = JsonApiRegistry.api('httpbin.org', 'https://httpbin.org');
  const upload = api.endpoint('put', 'PUT').build();

  const blob = new Blob([new Uint8Array(5 * 1024 * 1024)]);

  test('Simple', async () => {
    const response = await upload({
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: blob
    });

    expect(response.status).toBe(200);
  }, 60000);

  test('With progress', async () => {
    const onProgress = jest.fn<(progress: FetchProgressEvent) => void>();

    const request = trackRequestProgress(
      {
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: blob
      },
      onProgress
    );

    const response = await upload(request);

    expect(response.status).toBe(200);
    expect(onProgress).toHaveBeenCalled();

    expect(onProgress).toHaveBeenNthCalledWith(1, { lengthComputable: true, loaded: 0, total: blob.size });
    expect(onProgress).toHaveBeenLastCalledWith({ lengthComputable: true, loaded: blob.size, total: blob.size });
  }, 60000);
});
