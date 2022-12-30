import { PrimitiveValue } from './PrimitiveValue.js';

export type SimpleObject<T> = { [K in keyof T]: PrimitiveValue };
