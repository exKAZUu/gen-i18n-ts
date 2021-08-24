import { ErrorMessages } from './constants';
import { BaseType, FunctionType, ObjectType } from './types';
import * as utils from './utils';

export class CodeGenerator {
  static gen(typeObj: BaseType, langObjMap: { [lang: string]: unknown }, defaultLang: string): string {
    const langs = Object.keys(langObjMap);
    if (!langs.includes(defaultLang)) throw new Error(ErrorMessages.noDefaultLangFile());

    const varCurrentLang = 'currentLang';
    const varI18n = 'i18n';

    let code = `/**********************************************************************************************
* You MUST NOT modify this file manually because it is automatically generated by gen-i18n-ts *
**********************************************************************************************/

`;
    for (const [lang, langObj] of Object.entries(langObjMap)) {
      const langCode = this.langObjToCode(lang, langObj);
      code += `const ${lang} = ${langCode};\n`;
    }

    code += `let ${varCurrentLang} = ${defaultLang};\n`;

    const i18nCode = this.typeObjToCode(typeObj, varCurrentLang);
    code += `export const ${varI18n} = ${i18nCode};\n`;

    code += `${this.generateChangeLanguageCode(langs, varCurrentLang)}\n`;

    code += `${this.generateGetLanguageCode()}\n`;

    return code;
  }

  private static langObjToCode(lang: string, langObj: unknown): string {
    if (!utils.isObject(langObj)) throw new Error(ErrorMessages.langFileNotObject(lang));

    return this.langObjToCodeRecursively(lang, langObj, '');
  }

  private static langObjToCodeRecursively(lang: string, langObj: unknown, varName: string): string {
    if (utils.isString(langObj)) {
      return JSON.stringify(langObj);
    } else if (utils.isObject(langObj)) {
      let members = '';
      for (const [key, value] of Object.entries(langObj)) {
        const memberVarName = utils.memberVarName(varName, key);
        const valueCode = this.langObjToCodeRecursively(lang, value, memberVarName);
        members += `${key}: ${valueCode}, `;
      }
      return `{ ${members} }`;
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
        const memberVarName = utils.memberVarName(varName, key);
        const valueCode = this.typeObjToCode(value, memberVarName);
        members += `${key}: ${valueCode}, `;
      }
      return `{ ${members} }`;
    } else {
      throw new Error(ErrorMessages.unreachable());
    }
  }

  private static generateChangeLanguageCode(langs: string[], varCurrentLang: string): string {
    const funcChangeCurrentLang = 'changeLanguageByCode';
    const varLang = 'lang';
    const langType = langs.map((lang) => `"${lang}"`).join('|');
    const declaration = `export function ${funcChangeCurrentLang}(${varLang}: ${langType}): boolean`;

    const cases = langs.map((lang) => `case "${lang}": ${varCurrentLang} = ${lang}; return true;`).join(' ');
    const statement = `switch (${varLang}) { ${cases} } return false;`;

    return `${declaration} { ${statement} }`;
  }

  private static generateGetLanguageCode(): string {
    return `export function getFullLanguageCodeList(): string[] {
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
