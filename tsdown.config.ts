import {defineConfig} from 'tsdown';

const timestamp = process.env.TIMESTAMP;

export default defineConfig({
	clean: false,
	copy: [{
		from: './build/assets/javascript/search.mjs',
		rename: `search.${timestamp}.mjs`,
		to: `./build/assets/javascript`,
	}],
	deps: {
		alwaysBundle: /@oscarpalmer|data\.js$/,
		onlyBundle: false,
	},
	dts: false,
	entry: './source/assets/javascript/search.ts',
	// logLevel: 'error',
	minify: 'dce-only',
	outDir: './build/assets/javascript',
	unbundle: false,
});
