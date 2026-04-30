import {concurrently} from 'concurrently';
import {exec} from 'node:child_process';
import {mkdir, readFile, rm, unlink, writeFile} from 'node:fs/promises';
import {compileStringAsync} from 'sass';
import {build} from 'tsdown';

const timestamp = Date.now();

const noData = process.argv.includes('--no-data');
const watch = process.argv.includes('--watch');

async function asyncExec(command: string): Promise<void> {
	return new Promise((resolve, reject) => {
		console.log('   - Executing command:', command);

		exec(command, (error: unknown) => {
			if (error) {
				console.error('     ✗ Command failed:', error);

				reject(error);
			} else {
				console.log('     ✓ Command succeeded');

				resolve();
			}
		});
	});
}

async function createJavaScript(): Promise<void> {
	console.log(' - Creating JavaScript', timestamp);

	await build({
		copy: [
			{
				from: './build/assets/javascript/search.mjs',
				to: './build/assets/javascript',
				rename: `search.${timestamp}.mjs`,
			},
		],
		deps: {
			alwaysBundle: /^@oscarpalmer|data\.js$/,
			onlyBundle: false,
		},
		dts: false,
		entry: './source/assets/javascript/search.ts',
		logLevel: 'error',
		minify: true,
		outDir: './build/assets/javascript',
		unbundle: false,
	});

	await unlink('./build/assets/javascript/search.mjs');

	console.log('   ✓ JavaScript created');
}

async function createStylesheets(): Promise<void> {
	console.log(' - Creating stylesheets');

	const source = await readFile('./source/assets/stylesheets/styles.scss', 'utf-8');

	const compiled = await compileStringAsync(source, {
		importers: [
			{
				findFileUrl(url) {
					let prefix = './source/assets/stylesheets/';

					if (url.startsWith('@oscarpalmer')) {
						prefix = './node_modules/';
					}

					return new URL(`${prefix}${url}`, import.meta.url);
				},
			},
		],
		style: 'compressed',
	}).catch(() => ({
		css: '',
	}));

	await writeFile(`./build/assets/stylesheets/styles.${timestamp}.css`, compiled.css);

	console.log('   ✓ Stylesheets created');
}

async function generateEleventy(): Promise<void> {
	console.log(' - Generating Eleventy site');

	await asyncExec(
		`TIMESTAMP=${timestamp} ./node_modules/.bin/tsx ./node_modules/@11ty/eleventy/cmd.cjs`,
	);

	console.log('   ✓ Eleventy site generated');
}

async function generateTypedoc(): Promise<void> {
	console.log(' - Generating TypeDoc data');

	await asyncExec('./node_modules/.bin/tsx ./.typedoc/index.ts');

	console.log('   ✓ TypeDoc data generated');
}

async function prepare(): Promise<void> {
	console.log(' - Preparing build');

	await rm('./build', {recursive: true, force: true});
	await rm('./data/generated', {recursive: true, force: true});

	await mkdir('./build/assets/javascript', {recursive: true});
	await mkdir('./build/assets/stylesheets', {recursive: true});
	await mkdir('./data/generated', {recursive: true});

	await writeFile('./data/generated/all.js', '');

	console.log('   ✓ Build prepared');
}

if (!noData) {
	await prepare();

	await generateTypedoc();
}

if (watch) {
	console.log(' - Starting watch mode');

	const {result} = concurrently([
		`npx sass --watch --no-source-map source/assets/stylesheets/styles.scss:build/assets/stylesheets/styles.${timestamp}.css`,
		`TIMESTAMP=${timestamp} npx tsdown -c ./tsdown.config.ts --watch`,
		`TIMESTAMP=${timestamp} npx eleventy --serve --watch`,
	]);

	await result
		.then(() => {
			console.log(' ✓ Watch mode stopped');
		})
		.catch(error => {
			console.error(' ✗ Error in watch mode:', error);
		});
} else {
	await createStylesheets();
	await createJavaScript();

	await generateEleventy();

	console.log(' ✓ Build complete');
}
