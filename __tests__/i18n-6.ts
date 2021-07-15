import assert from 'assert';
import path from 'path';

import { genI18ts } from '../src';

test('i18n-6: tricky arguments', async () => {
  const inputDir = path.resolve(__dirname, '..', 'test-fixtures', 'i18n-6');
  const outFile = path.resolve(__dirname, '..', 'test-fixtures', 'temp', 'i18n-6.ts');
  genI18ts(inputDir, outFile, 'en');

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Auto-generated module
  // eslint-disable-next-line import/no-unresolved
  const { i18n, changeCurrentLang } = await import('../test-fixtures/temp/i18n-6');

  assert(i18n.test('b', 'a') === 'b and a');
  assert(i18n.test('${b}', 'a') === '${b} and a');
  assert(i18n.test('b', '${a}') === 'b and ${a}');
  assert(i18n.test('${b}', '${a}') === '${b} and ${a}');

  changeCurrentLang('ja');
  assert(i18n.test('b', 'a') === 'b と a');
  assert(i18n.test('${b}', 'a') === '${b} と a');
  assert(i18n.test('b', '${a}') === 'b と ${a}');
  assert(i18n.test('${b}', '${a}') === '${b} と ${a}');
});
