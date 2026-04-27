import {defineConfig} from 'vite-plus';
import rules from './node_modules/@oscarpalmer/atoms/plugin/rules.js';

export default defineConfig({
	base: './',
	fmt: {
		arrowParens: 'avoid',
		bracketSpacing: false,
		singleQuote: true,
		useTabs: true,
	},
	lint: {
		jsPlugins: ['./node_modules/@oscarpalmer/atoms/plugin/index.js'],
		rules: {
			...rules,
		},
	},
});
