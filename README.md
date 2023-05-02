# api-registry

Centralized HTTP API client for the browser and Node.js based on [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch).
Supports request caching with [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache).

## Getting started

```typescript
import { JsonApiRegistry } from 'api-registry';

// Register an API
const api = JsonApiRegistry.api('user-api', 'https://reqres.in/api');

// Define an endpoint
const getUser = api
  .endpoint('users/{id}') // See https://github.com/teil-one/rfc6570-uri-template for supported templates
  .receives<{ id: number }>()
  .returns<{ id: number; email: string }>()
  .build();

// GET https://reqres.in/api/users/1
const response = await getUser({ id: 1 });

// Parse the JSON data from the response (see https://developer.mozilla.org/en-US/docs/Web/API/Response)
const user = await response.json();
console.log(user);
```

## Send POST requests
```typescript
const createUser = api
  .endpoint('users', 'POST')
  .returns<CreatedUser>()
  .receives<NewUser>()
  .buildWithParse(); // Builds a method that parses the returned JSON

const user = await createUser({ email: 'new.user@reqres.in' });
```

## Share an API across micro frontends

The library registers API objects [globally](https://developer.mozilla.org/en-US/docs/Glossary/Global_object). It allows to register an API in one application and reuse it in another.

#### Frontend 1

```typescript
const api = JsonApiRegistry.api('user-api', 'https://reqres.in/api');
```

#### Frontend 2

```typescript
const api = JsonApiRegistry.api('user-api'); // The base URL will be picked up from the already registered API
```

## Cache responses

```typescript
const getUser = api
  .endpoint('users/{id}')
  .receives<{ id: number }>()
  .returns<{ id: number; email: string }>()
  .withCache(1000) // Cache requests for 1000 ms
  .buildWithParse();

const user1 = await getUser({ id: 1 }); // The response will be cached for 1 second
const user1_ = await getUser({ id: 1 }); // There will be no additional HTTP request. The data will be read from the cache

const user2 = await getUser({ id: 2 }); // The request is different and the HTTP response will be cached for 1 second
```

## Send custom headers and other request options

### On the endpoint level

```typescript
const getUser = api
  .endpoint('users/{id}')
  .withOptions({ headers: { Authorization: 'Basic ZXhhbXBsZQ==' }, referrer: 'http://foo.bar/' }) // See all options at https://developer.mozilla.org/en-US/docs/Web/API/Request
  .receives<{ id: number }>()
  .returns<{ id: number; email: string }>()
  .build();
```

### On the request level

```typescript
const response = await getUser({ id: 1 }, { headers: { 'uber-trace-id': '00000000000000009c54cc5904914703:cf0f9dbcc295b86c:0:1' }});
```

Request options from different levels and different frontends are combined.

## Use factory methods

### For the base URL

```typescript
const api = JsonApiRegistry.api('user-api', () => Promise.resolve('https://reqres.in/api'));
```

### For the request options

```typescript
const getUser = api
  .endpoint('users/{id}')
  .withOptions(() => Promise.resolve({ headers: { Authorization: 'Basic ZXhhbXBsZQ==' }}))
  .receives<{ id: number }>()
  .returns<{ id: number; email: string }>()
  .build();

const response = await getUser({ id: 1 }, () => Promise.resolve({ headers: { 'uber-trace-id': '00000000000000009c54cc5904914703:cf0f9dbcc295b86c:0:1' }}));
```

## Intercept requests

### On the API level

All requests to the API will be handled by the passed interception function.

```typescript
JsonApiRegistry.api('rest-api', 'http://foo.bar/api')
  .intercept(
    async (request: Request, next: () => Promise<Response>): Promise<Response> => {
      let response = await next();

      if (response.status === 401) {
        // ... Authenticate

        // Repeat the request
        response = await next();
      }

      return response;
    }
  );
```

### On the endpoint level

All requests to the endpoint will be handled by the passed interception function.

```typescript
const getUser = api.endpoint('user/{id}')
  .receives<{ id: number }>()
  .intercept(
    async (request: Request, next: () => Promise<Response>): Promise<Response> => {
      let response = await next();

      // ...

      return response;
    }
  )
  .build();
```

## Usage options

The library is built as an [ES module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and as a [CommonJS module](https://nodejs.org/api/modules.html). It can be used in Javascript, Typescript, and Node.js applications.

The ES module can be used in a web browser directly from a CDN. See the [examples](examples/) folder.

[GitHub](https://github.com/teil-one/api-registry) · [NPM package](https://www.npmjs.com/package/api-registry)
