import { ErrorMessages } from './constants';
import type { BaseType } from './types';
import { FunctionType, ObjectType } from './types';
import { getMemberVarName, isObject, isString } from './utils';

export class CodeGenerator {
  static gen(typeObj: BaseType, langToLangObj: Map<string, unknown>, defaultLang: string): string {
    const langs = [...langToLangObj.keys()];

    const varLanguages = 'languages';
    const varCurrentLang = 'currentLang';
    const varI18n = 'i18n';
    const varI18nType = 'I18n';

    let code = `/*---------------------------------------------------------------------------------------------*
 * You MUST NOT modify this file manually because it is automatically generated by gen-i18n-ts *
 *---------------------------------------------------------------------------------------------*/

/* eslint-disable */

`;

    let members = '';
    for (const [lang, langObj] of langToLangObj.entries()) {
      const langCode = this.langObjToCode(lang, langObj);
      members += `${JSON.stringify(lang)}: ${langCode}, `;
    }
    code += `const ${varLanguages} = { ${members} };\n`;

    code += `let ${varCurrentLang} = ${varLanguages}[${JSON.stringify(defaultLang)}];\n`;

    const i18nCode = this.typeObjToCode(typeObj, varCurrentLang);
    code += `export const ${varI18n} = ${i18nCode};\n`;
    code += `export type ${varI18nType} = typeof ${varI18n};\n`;

    code += `${this.generateChangeLanguageCode(langs, varLanguages, varCurrentLang)}\n`;

    code += `${this.generateGetLanguageCode()}\n`;

    return code;
  }

  private static langObjToCode(lang: string, langObj: unknown): string {
    if (!isObject(langObj)) throw new Error(ErrorMessages.langFileNotObject(lang));

    return this.langObjToCodeRecursively(lang, langObj, '');
  }

  private static langObjToCodeRecursively(lang: string, langObj: unknown, varName: string): string {
    if (isString(langObj)) {
      return JSON.stringify(langObj);
    } else if (isObject(langObj)) {
      let members = '';
      for (const [key, value] of Object.entries(langObj)) {
        const memberVarName = getMemberVarName(varName, key);
        const valueCode = this.langObjToCodeRecursively(lang, value, memberVarName);
        members += `${JSON.stringify(key)}: ${valueCode}, `;
      }
      return `{ "__code__": "${lang}", ${members} }`;
    }

    throw new Error(ErrorMessages.varShouldStringOrObject(lang, varName));
  }

  private static typeObjToCode(typeObj: BaseType, varName: string): string {
    if (typeObj instanceof FunctionType) {
      const params = typeObj.params.map((param) => `${param}: string`).join(', ');
      const declaration = `function (${params}): string`;
      if (typeObj.params.length === 0) return `${declaration} { return ${varName} }`;

      const varParamMap = 'paramMap';
      const members = typeObj.params.map((param) => `"\${${param}}" : ${param},`).join(' ');
      const declarationStatement = `const ${varParamMap}: Record<string, string> = { ${members} };`;

      const varPattern = 'pattern';
      const patterns = typeObj.params.map((param) => `\\$\\{${param}\\}`).join('|');
      const regex = `/${patterns}/g`;
      const replaceFunc = `(${varPattern}) => ${varParamMap}[${varPattern}]`;
      const returnStatement = `return ${varName}.replace(${regex}, ${replaceFunc});`;

      return `${declaration} { ${declarationStatement} ${returnStatement} }`;
    } else if (typeObj instanceof ObjectType) {
      let members = '';
      for (const [key, value] of Object.entries(typeObj.map)) {
        const memberVarName = getMemberVarName(varName, key);
        const valueCode = this.typeObjToCode(value, memberVarName);
        members += `${JSON.stringify(key)}: ${valueCode}, `;
      }
      return `{ ${members} }`;
    } else {
      throw new TypeError(ErrorMessages.unreachable());
    }
  }

  private static generateChangeLanguageCode(langs: string[], varLanguages: string, varCurrentLang: string): string {
    const funcChangeCurrentLang = 'changeLanguageByCode';
    const varLang = 'lang';
    const declaration = `export function ${funcChangeCurrentLang}(${varLang}: string): boolean`;

    const cases = langs
      .map((lang) => `case "${lang}": ${varCurrentLang} = ${varLanguages}[${JSON.stringify(lang)}]; return true;`)
      .join(' ');
    const statement = `switch (${varLang}) { ${cases} } return false;`;

    return `${declaration} { ${statement} }`;
  }

  private static generateGetLanguageCode(): string {
    return `export function getCurrentLanguageCode(): string {
  return currentLang.__code__;
}
export function getFullAndShortLanguageCodeList(): string[] {
  const langSet = new Set<string>();
  const fullLangs = getFullLanguageCodeList();
  const shortLangs = getShortLanguageCodeList();
  const length = Math.max(fullLangs.length, shortLangs.length);
  for (let i = 0; i < length; i++) {
    if (fullLangs[i]) langSet.add(fullLangs[i]);
    if (shortLangs[i]) langSet.add(shortLangs[i]);
  }
  return [...langSet];
}
export function getFullLanguageCodeList(): string[] {
  const langSet = new Set<string>();
  const nav = window.navigator || {};
  if (Array.isArray(nav.languages)) {
    for (const lang of nav.languages) {
      if (lang) langSet.add(lang);
    }
  }
  for (const key of ['language', 'browserLanguage', 'systemLanguage', 'userLanguage']) {
    const lang = (nav as any)[key];
    if (lang) langSet.add(lang);
  }
  return [...langSet];
}
export function getShortLanguageCodeList(): string[] {
  return [...new Set(getFullLanguageCodeList().map(lang => lang.split('-')[0]).filter(lang => !!lang))];
}`;
  }
}
