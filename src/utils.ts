import * as path from 'path';

export function isString(obj: unknown): obj is string {
  return typeof obj === 'string';
}

export function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

export function filepathToLang(langFilepath: string): string {
  return path.parse(langFilepath).name;
}

export function langToFilename(lang: string): string {
  return `${lang}.json`;
}

export function memberVarName(objectVarName: string, key: string): string {
  return objectVarName != '' ? `${objectVarName}.${key}` : key;
}

export function arrayIntersect<T>(a: T[], b: T[]): T[] {
  // TODO: faster algorithm may exist
  return a.filter((e) => b.includes(e));
}

export function arrayDiff<T>(a: T[], b: T[]): T[] {
  // TODO: faster algorithm may exist
  return a.filter((e) => !b.includes(e));
}
