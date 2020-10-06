import del from 'del';
import { promises as fsPromises } from 'fs';
import { outputFile } from 'fs-extra';
import globby from 'globby';
import mkdirp from 'mkdirp';
import ncp from 'ncp';
import buildNextApp from 'next/dist/build';
import exportNextApp from 'next/dist/export';
import { join, resolve } from 'path';
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
  const ignoredFiles = ignore ? `!${resolve(sourceDir, ignore)}` : '';

  const appSrcDir = resolve(__dirname, '..', 'src', 'app');
  const tempDir = join(outDir, '..', 'temp');

  // Before building, clean up the old build if one exists
  try {
    await del([outDir]);
    await del([tempDir]);
  } catch (err) {
    logFatalError(`An error occurred while purging previous build: ${err.message}`);
    return;
  }

  // Create a temp directory to do work in
  try {
    await mkdirp(tempDir);
  } catch (err) {
    logFatalError(`An error occurred while creating temp directory: ${err.message}`);
    return;
  }

  // Create a content directory to move our MD files
  try {
    await mkdirp(join(tempDir, 'content'));
  } catch (err) {
    logFatalError(`An error occurred while creating temp content directory: ${err.message}`);
    return;
  }

  // Copy the react app into the temp directory
  try {
    await promisify(ncp)(appSrcDir, tempDir);
  } catch (err) {
    logFatalError(`An error occurred while copying the app base: ${err.message}`);
    return;
  }

  // Using globs, bring our content into the temp directory
  try {
    const markdownFiles = await globby([resolve(sourceDir, '**', '*.md'), ignoredFiles]);
    // This is hacky as fuck and sucks. I'd love an alternative solution. At the very least we can
    // promise.all and copy everything at the same time
    Promise.all(
      markdownFiles.map(async (file) => {
        // Grab the filename by splitting the path to get the name of the subdirectory
        const [, parsedFileName] = file.split(resolve(sourceDir));
        // Read the file, re output it (ew)
        return outputFile(
          join(tempDir, 'content', parsedFileName),
          await fsPromises.readFile(file)
        );
      })
    );
  } catch (err) {
    logFatalError(
      `An error occurred while scanning ${sourceDir} for Markdown files: "${err.message}"`
    );
    return;
  }

  // This runs the script that the command "next build" runs
  try {
    await buildNextApp(resolve(tempDir));
  } catch (err) {
    logFatalError(`An error occurred while building Nextjs app ${outDir}: ${err.message}`);
    return;
  }

  // This runs the script that the command "next export" runs
  try {
    await exportNextApp(tempDir, {
      outdir: resolve(outDir),
      silent: true,
    });
  } catch (err) {
    logFatalError(`An error occurred while exporting Nextjs app to static html: ${err.message}`);
    return;
  }

  // I'm not putting this into a try catch because since everything already succeeded I couldn't
  // care less if this fails
  // await del([tempDir]);

  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.info(`\n\nStatic site has been generated at ${resolve(outDir)}`);
    process.exit(0);
  }, 500);
};
