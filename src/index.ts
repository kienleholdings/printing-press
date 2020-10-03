#!/usr/bin/env node

import yargs from 'yargs';
import generate from './generate';

yargs
  .scriptName('printing-press')
  .usage('$0 <cmd> [args]')
  .command(
    'generate',
    'Generate a static site from markdown files in the current directory',
    generate
  )
  .demandCommand(1, '')
  .help();
