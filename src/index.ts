import yargs from 'yargs';
import { builder, generateHandler } from './generate';

yargs
  .scriptName('printing-press')
  .usage('$0 <cmd> [args]')
  .command(
    'generate',
    'Generate a static site from markdown files in the current directory',
    builder,
    // I honestly have no idea what TS hates about this, it's stupid. TODO: Fix the explicit any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generateHandler as any
  )
  .demandCommand(1, '')
  .help()
  .parse();
