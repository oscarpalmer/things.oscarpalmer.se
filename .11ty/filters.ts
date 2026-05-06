import {join} from '@oscarpalmer/atoms/string';
import Shiki from '@shikijs/markdown-it';
import MarkdownIt from 'markdown-it';
import type {ParameterReflection, SignatureReflection} from 'typedoc';
import type {DataItem} from '../.typedoc/model.ts';
import {findCrumb, renderCode} from './helpers.ts';

const md = new MarkdownIt({
	html: true,
});

md.use(
	await Shiki({
		defaultLanguage: 'typescript',
		themes: {
			dark: 'github-dark',
			light: 'github-light',
		},
	}),
);

export async function getCode(code: string): Promise<string> {
	return renderCode(code);
}

export function getBreadcrumbs(url: string) {
	const parts = url.split('/').filter(part => part.length > 0);

	return [
		{
			label: 'Home',
			url: '/',
		},
		...parts.map((part, index) => {
			const url = `/${join(parts.slice(0, index + 1), '/').replace(/^\/|\/$/g, '')}/`;
			const item = findCrumb(url);

			return {
				url,
				label: item?.declaration?.name ?? item?.name.original ?? part,
			};
		}),
	];
}

export function getExample(signature: SignatureReflection): string {
	return renderMarkdown(
		signature.comment?.blockTags?.find(tag => tag.tag === '@example')?.content ?? '',
	);
}

export function getGroupUrl(item: DataItem): string {
	return item.url.replace(/\/\w+$/, '');
}

export function getReturns(signature: SignatureReflection): string {
	const returns = signature.comment?.blockTags?.find(tag => tag.tag === '@returns');

	return returns == null ? '' : renderMarkdown(returns.content);
}

export function getSourceUrl(signature: SignatureReflection, item: DataItem): string {
	const source = signature.sources![0];

	if (source == null) {
		return '';
	}

	const filename = source.fullFileName?.replace(
		new RegExp(`^.+@oscarpalmer/${item.package.original}/src/`),
		'',
	);

	return filename == null
		? ''
		: `<p><a href="https://github.com/oscarpalmer/${item.package.original}/blob/main/src/${filename}#L${source.line}">Source</a></p>`;
}

export function getType(parameter: ParameterReflection): string {
	if (parameter.type == null) {
		return 'unknown';
	}

	if ((parameter.type as any).name != null) {
		return (parameter.type as any).name;
	}

	return 'unknown';
}

export function renderMarkdown(value: unknown) {
	return typeof value === 'string'
		? md.render(value)
		: Array.isArray(value)
			? md.render(
					join(
						value
							.map(part => (typeof part === 'object' && 'text' in part ? part.text : part))
							.filter(part => typeof part === 'string'),
						'',
					),
				)
			: '';
}
