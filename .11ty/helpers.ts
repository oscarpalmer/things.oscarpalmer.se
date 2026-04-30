import {dedent} from '@oscarpalmer/atoms/string';
import {endsWith, includes} from '@oscarpalmer/atoms/string/match';
import {codeToHtml} from 'shiki';
import type {DataItem} from '../.typedoc/model.ts';
import data from '../data/generated/all.js';

export function findCrumb(needle: unknown): DataItem | undefined {
	return findDataItem(needle);
}

function findDataItem(needle: unknown): DataItem | undefined {
	if (typeof needle !== 'string') {
		return;
	}

	const normalized = `/${needle.toLowerCase().replace(/^\/|\/$/g, '')}/`;

	const keys = Object.keys(data as Record<string, any>).filter(key => includes(key, normalized));

	for (const key of keys) {
		if (key === normalized || endsWith(key, normalized)) {
			const item = (data as Record<string, any>)[key] as DataItem;

			if (item != null) {
				return {...item, url: key};
			}
		}
	}
}

export function findItem(needle: unknown): DataItem | undefined {
	return findDataItem(needle);
}

export async function renderCode(code: string): Promise<string> {
	return codeToHtml(/^\s/.test(code) ? dedent(code) : code, {
		lang: 'typescript',
		themes: {
			dark: 'github-dark',
			light: 'github-light',
		},
	});
}
