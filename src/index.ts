import fs from 'fs';
import path from 'path';

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { CodeGenerator } from './codeGenerator';
import { ErrorMessages, InfoMessages } from './constants';
import { LangFileConverter } from './langFileConverter';
import { ObjectAnalyzer } from './objectAnalyzer';
import * as utils from './utils';

export function geni18ts(indir: string, outfile: string, defaultLang: string): void {
  const langFilePaths = fs
    .readdirSync(indir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((langFileName) => path.join(indir, langFileName));

  const defaultLangFilePath = path.join(indir, utils.langToFilename(defaultLang));

  if (!langFilePaths.includes(defaultLangFilePath)) throw new Error(ErrorMessages.noDefaultLangFile());

  const typeObj = LangFileConverter.toTypeObj(defaultLangFilePath);
  const defaultJsonObj = LangFileConverter.toJsonObj(defaultLangFilePath);

  const jsonObjMap: { [lang: string]: unknown } = {};
  for (const langFilePath of langFilePaths) {
    console.info(InfoMessages.analyzingLangFile(langFilePath));
    const lang = utils.filepathToLang(langFilePath);
    const jsonObj = LangFileConverter.toJsonObj(langFilePath);
    ObjectAnalyzer.analyze(typeObj, lang, jsonObj, defaultJsonObj);
    jsonObjMap[lang] = jsonObj;
  }

  const code = CodeGenerator.gen(typeObj, jsonObjMap, defaultLang);
  fs.writeFileSync(outfile, code, { encoding: 'utf-8' });
}

export function cli(argv: string[]): void {
  const { inputDir, outfile, defaultLang } = yargs(hideBin(argv)).options({
    inputDir: {
      type: 'string',
      alias: 'i',
      describe: 'A path to input directory',
      demandOption: true,
    },
    outfile: {
      type: 'string',
      alias: 'o',
      describe: 'A path to output file',
      demandOption: true,
    },
    defaultLang: {
      type: 'string',
      alias: 'd',
      describe: 'A name of a default language',
      demandOption: true,
    },
  }).argv;

  geni18ts(inputDir, outfile, defaultLang);
}
