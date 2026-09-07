import fs from 'node:fs/promises';
import path from 'node:path';
import { rimraf } from 'rimraf';
import { replaceTscAliasPaths } from 'tsc-alias';
import { pathExists, spawnAsync, findFiles } from './util';

/* Config */
/**
 * Path to directory containing project source code.
 */
const SrcDirectory = 'src';
/**
 * Path to tsconfig.json used to build the project.
 */
const TsConfigPath = 'tsconfig.build.json';
/**
 * Path to package.json.
 */
const PackageJsonPath = 'package.json';
/**
 * Path to directory into which project builds.
 */
const DistDir = 'dist';


// Validation
/* Validate script is being run from project root */
const isInRoot = await pathExists(PackageJsonPath);
if (!isInRoot) {
  console.error(`Could not find '${PackageJsonPath}'. Is this script being run from the project root?`);
  process.exit(1);
}

// Main
/* Clean */
console.log(`Cleaning build...`);
await spawnAsync(`tsc --build ${TsConfigPath} --clean`);
await rimraf(DistDir);

/* Compile */
console.log(`Compiling project...`);
await spawnAsync(`tsc --build ${TsConfigPath}`);

/* Manually transform and emit shader files */
console.log(`Compiling shader files... `);
const shaderFiles = await findFiles(/(\.vert$|\.frag$)/, SrcDirectory);
for (const shaderFile of shaderFiles) {
  const fileContents = await fs.readFile(shaderFile, { encoding: 'utf8' });
  const newFileContents = `export default ${JSON.stringify(fileContents)}`;

  const outputFilePath = path.join(DistDir, path.relative(SrcDirectory, `${shaderFile}.js`));
  const oututFileDir = path.join(outputFilePath, '..');

  await fs.mkdir(oututFileDir, { recursive: true });
  await fs.writeFile(outputFilePath, newFileContents);
  const dtsFilePath = path.join(DistDir, path.relative(SrcDirectory, `${shaderFile}.d.ts`));
  await fs.copyFile(`${shaderFile}.d.ts`, dtsFilePath);
  console.log(`\tWrote shader '${outputFilePath}'.`);
}

/* Rewrite import aliases */
console.log(`Rewriting import aliases...`);
await replaceTscAliasPaths({
  configFile: TsConfigPath,
});

console.log(`Finished processing successfully.`);
