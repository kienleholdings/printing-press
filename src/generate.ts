import globby from 'globby';
import { join } from 'path';
import { Argv } from 'yargs';

import { logFatalError } from './utils';

export const generateBuilder = (yargs: Argv<unknown>): Argv<unknown> => {
  return yargs.options({
    ignore: {
      alias: 'i',
      description: 'A glob specifying which folders / specific files to ignore',
      group: 'Input',
      required: false,
      string: true,
    },
    outDir: {
      alias: 'o',
      default: './build',
      description: 'The directory in which the static site will be saved to',
      group: 'Output',
      required: false,
      string: true,
    },
    sourceDir: {
      alias: 's',
      default: './',
      description: 'The directory in which printing-press will look for Markdown files',
      group: 'Input',
      required: false,
      string: true,
    },
  });
};

interface Params {
  ignore?: string;
  outDir: string;
  sourceDir: string;
}

export const generateHandler = async (params: Params): Promise<void> => {
  const { ignore, sourceDir } = params;

  let markdownFiles: string[] = [];
  const ignoredFiles = ignore ? `!${join(sourceDir, ignore)}` : '';

  try {
    markdownFiles = await globby([join(sourceDir, '**', '*.md'), ignoredFiles]);
  } catch (err) {
    logFatalError(
      `An error occurred while scanning ${sourceDir} for Markdown files: "${err.message}"`
    );
    return;
  }

  console.log('@@@@!!!!', markdownFiles);
};
