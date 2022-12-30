export class JsonResponse<TResult> extends Response {
  override async json(): Promise<TResult> {
    const response = await super.json();

    return response as TResult;
  }
}
