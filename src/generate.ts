import globby from 'globby';
import mkdirp from 'mkdirp';
import ncp from 'ncp';
import buildNextApp from 'next/dist/build';
import exportNextApp from 'next/dist/export';
import { join, resolve } from 'path';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { Arguments } from 'yargs';

import { logFatalError } from './utils';

export const builder = {
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
};

interface Params {
  ignore?: string;
  outDir: string;
  sourceDir: string;
}

export const generateHandler = async (params: Arguments<Params>): Promise<void> => {
  const { ignore, outDir, sourceDir } = params;

  let markdownFiles: string[] = [];
  const ignoredFiles = ignore ? `!${resolve(sourceDir, ignore)}` : '';

  try {
    markdownFiles = await globby([resolve(sourceDir, '**', '*.md'), ignoredFiles]);
  } catch (err) {
    logFatalError(
      `An error occurred while scanning ${sourceDir} for Markdown files: "${err.message}"`
    );
    return;
  }

  // Not sure if we're keeping this implementation yet, there might be a better way to do it with nextjs
  console.log('@@@@!!!!', markdownFiles);

  const tempDir = join(outDir, '..', 'temp');

  // Before building, clean up the old build if one exists
  try {
    await promisify(rimraf)(outDir);
    await promisify(rimraf)(tempDir);
  } catch (err) {
    logFatalError(`An error occurred while purging previous build ${outDir}: ${err.message}`);
    return;
  }

  const appSrcDir = resolve(__dirname, 'app');

  try {
    await mkdirp(tempDir);
  } catch (err) {
    logFatalError(`An error occurred while creating temp directory: ${err.message}`);
    return;
  }

  try {
    await promisify(ncp)(appSrcDir, tempDir);
  } catch (err) {
    logFatalError(`An error occurred while building Nextjs app ${outDir}: ${err.message}`);
    return;
  }

  try {
    await buildNextApp(resolve(tempDir));
  } catch (err) {
    logFatalError(`An error occurred while building Nextjs app ${outDir}: ${err.message}`);
    return;
  }

  try {
    await exportNextApp(tempDir, {
      outdir: resolve(outDir),
      silent: true,
    });
  } catch (err) {
    logFatalError(`An error occurred while exporting Nextjs app to static html: ${err.message}`);
    return;
  }

  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.info(`\n\nStatic site has been generated at ${resolve(outDir)}`);
    process.exit(0);
  }, 500);
};
