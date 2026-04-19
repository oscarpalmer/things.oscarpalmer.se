import {join} from '@oscarpalmer/atoms/string';
import MarkdownIt from 'markdown-it';
import {findCrumb, renderCode} from './helpers.ts';
import type { DataItem } from '../.typedoc/model.ts';

const md = new MarkdownIt({
	html: true,
});

export async function getCode(code: string, url: string): Promise<string> {
	return renderCode(code, url);
}

export function getBreadcrumbs(url: string) {
	const parts = url.split('/').filter(part => part.length > 0);

	return [
		{
			label: 'Home',
			url: '/',
		},
		...parts.map((part, index) => {
			const url = `/${join(parts.slice(0, index + 1), '/')}/`;
			const item = findCrumb(url);

			return {
				url,
				label: item?.name.original ?? part,
			};
		}),
	];
}

export function getGroupUrl(item: DataItem): string {
	return item.url.replace(/\/\w+$/, '');
}

export function renderMarkdown(value: unknown) {
	return typeof value === 'string'
		? md.render(value)
		: Array.isArray(value)
		? md.render(
				join(
					value
						.map(part =>
							typeof part === 'object' && 'text' in part ? part.text : part,
						)
						.filter(part => typeof part === 'string'),
					'',
				),
		  )
		: '';
}
