import {minify as minifyHtml} from 'html-minifier';
import {getTitle} from './.11ty/codes.ts';
import {
	getBreadcrumbs,
	getCode,
	getGroupUrl,
	getReturns,
	getSourceUrl,
	getType,
	renderMarkdown,
} from './.11ty/filters.ts';

const timestamp = Number.parseInt(process.env.TIMESTAMP, 10);

const watch = process.argv.includes('--watch');

const options = {
	browser: {
		port: 4567,
	},

	html: {
		collapseWhitespace: true,
		decodeEntities: true,
		removeComments: true,
	},
};

export default config => {
	config.addGlobalData(
		'canonicalUrl',
		watch ? 'http://localhost:4567' : 'https://things.oscarpalmer.se',
	);

	config.addGlobalData('production', !watch);

	config.addGlobalData('timestamp', {
		iso: new Date(timestamp).toISOString(),
		unix: timestamp,
	});

	config.addGlobalData('version', process.env.ELEVENTY_VERSION || '???');

	config.addFilter('breadcrumbs', getBreadcrumbs);
	config.addFilter('code', getCode);
	config.addFilter('groupUrl', getGroupUrl);
	config.addFilter('markdown', renderMarkdown);
	config.addFilter('returns', getReturns);
	config.addFilter('sourceUrl', getSourceUrl);
	config.addFilter('type', getType);

	config.addShortcode('getTitle', getTitle);

	config.addPassthroughCopy({
		'source/assets/images': 'assets/images',
		'source/robots.txt': 'robots.txt',
	});

	config.addWatchTarget('source');

	config.setServerOptions(options.browser);

	config.addTransform('html', (content, path) => {
		if (watch || !path.endsWith('.html')) {
			return content;
		}

		return minifyHtml(content, options.html);
	});

	config.setQuietMode(true);

	return {
		dir: {
			data: '../../data',
			includes: '../layouts/partials',
			input: 'source/pages',
			layouts: '../layouts',
			output: 'build',
		},
		htmlTemplateEngine: 'liquid',
		markdownTemplateEngine: 'liquid',
		passthroughFileCopy: true,
	};
};
