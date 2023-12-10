import { jest } from '@jest/globals';
import { FetchProgressEvent, trackResponseProgress } from 'fetch-api-progress';
import { JsonApiRegistry } from '../../src';

describe('Download from httpbin.org API', () => {
  const api = JsonApiRegistry.api('httpbin.org', 'https://httpbin.org');
  const download = api.endpoint('put', 'PUT').build();

  const blob = new Blob([new Uint8Array(1024)]);

  test('With progress', async () => {
    const onProgress = jest.fn<(progress: FetchProgressEvent) => void>();

    const request = {
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: blob
    };

    // Read without progress to get the expected size
    const expectedSize = await readResponse(await download(request));

    // Read with progress
    const response = trackResponseProgress(await download(request), onProgress);

    expect(response.status).toBe(200);

    await readResponse(response);

    expect(onProgress).toHaveBeenCalled();
    expect(onProgress).toHaveBeenNthCalledWith(1, { lengthComputable: true, loaded: 0, total: expectedSize });
    expect(onProgress).toHaveBeenLastCalledWith({ lengthComputable: true, loaded: expectedSize, total: expectedSize });
  });
});

async function readResponse(response: Response): Promise<number> {
  if (response.body === null) {
    return 0;
  }

  let bodyLength = 0;
  const reader = response.body.getReader();
  for await (const chunk of readChunks(reader)) {
    bodyLength += chunk.length;
  }

  return bodyLength;
}

function readChunks(reader: ReadableStreamDefaultReader<Uint8Array>): {
  [Symbol.asyncIterator]: () => AsyncGenerator<Uint8Array, void, unknown>;
} {
  return {
    async *[Symbol.asyncIterator]() {
      let readResult = await reader.read();
      while (!readResult.done) {
        yield readResult.value;
        readResult = await reader.read();
      }
    }
  };
}
