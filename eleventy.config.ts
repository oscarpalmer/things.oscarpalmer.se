import {minify as minifyHtml} from 'html-minifier';
import {getTitle} from './.11ty/codes.ts';
import {
	getBreadcrumbs,
	getCode,
	getGroupUrl,
	getReturns,
	getType,
	renderMarkdown,
} from './.11ty/filters.ts';

const environment = {
	production: (process.env.ELEVENTY_RUN_MODE || 'development') === 'build',
};

const now = new Date();

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
		environment.production ? 'https://things.oscarpalmer.se' : 'http://localhost:4567',
	);

	config.addGlobalData('production', environment.production);

	config.addGlobalData('timestamp', {
		iso: now.toISOString(),
		unix: now.getTime(),
	});

	config.addGlobalData('version', process.env.ELEVENTY_VERSION || '???');

	config.addFilter('breadcrumbs', getBreadcrumbs);
	config.addFilter('code', getCode);
	config.addFilter('groupUrl', getGroupUrl);
	config.addFilter('markdown', renderMarkdown);
	config.addFilter('returns', getReturns);
	config.addFilter('type', getType);

	config.addShortcode('getTitle', getTitle);

	config.addPassthroughCopy({
		'source/assets/images': 'assets/images',
		'source/assets/javascript': 'assets/javascript',
		'source/robots.txt': 'robots.txt',
	});

	config.addWatchTarget('source');

	config.setServerOptions(options.browser);

	if (environment.production) {
		config.addTransform('html', (content, path) => {
			return path.endsWith('.html') ? minifyHtml(content, options.html) : content;
		});
	}

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
