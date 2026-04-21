import {defineConfig} from 'tsdown';

export default defineConfig({
	clean: false,
	deps: {
		alwaysBundle: /@oscarpalmer/,
		neverBundle: /\.js/,
		onlyBundle: false,
	},
	entry: './source/assets/javascript/search.ts',
	minify: false,
	outDir: './build/assets/javascript',
});
