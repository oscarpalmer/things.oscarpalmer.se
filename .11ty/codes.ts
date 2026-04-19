import {join} from '@oscarpalmer/atoms/string';
import meta from '../data/meta.js';
import type {Breadcrumb} from '../.typedoc/model.ts';

export function getTitle(this: any, breadcrumbs: Breadcrumb[]): string {
	const {paginated} = this.ctx.environments;

	if (paginated == null) {
		return meta.title;
	}

	return join(
		[
			...breadcrumbs
				.slice()
				.reverse()
				.map(crumb => crumb.label)
				.slice(0, -1),
			meta.title,
		],
		' – ',
	);
}
