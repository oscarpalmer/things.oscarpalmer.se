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

	const normalized = needle.includes('/')
		? needle.toLowerCase().replace(/\/$/, '')
		: `/${needle.toLowerCase()}`;

	const keys = Object.keys(data as Record<string, any>).filter(key => key.includes(normalized));

	for (const key of keys) {
		if (key === normalized || key.endsWith(normalized)) {
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
	return codeToHtml(code, {
		lang: 'typescript',
		themes: {
			dark: 'github-dark',
			light: 'github-light',
		},
	});
}
