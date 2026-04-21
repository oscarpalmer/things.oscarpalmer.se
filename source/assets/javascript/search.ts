import {array, computed, fragments, html, signal, type Fragment} from '@oscarpalmer/abydon';
import {includes} from '@oscarpalmer/atoms/string/match';
import '@oscarpalmer/oui/popover';
import type {DataSearch} from '../../../.typedoc/model';
import data from './data.js';

function identifyItem(item: DataSearch): string {
	return item.url;
}

function onSubmit(event: SubmitEvent): void {
	event.preventDefault();
}

function renderItem(item: DataSearch): Fragment {
	let overloads = '';

	if (item.values.length > 1) {
		overloads = `<p class="search__results__list__item__overloads">(+ ${item.values.length - 1} overloads)</p>`;
	}

	return html`<li class="stack stack--small search__results__list__item">
		<header class="flow flex-jc--sb search__results__list__item__header">
			<h3 class="search__results__list__item__title">
				<a href="${item.url}">${item.name.original}</a>
			</h3>
			<span class="oui-tag oui-tag--tiny">@oscarpalmer/${item.package.original}</span>
		</header>
		<div class="stack stack--text search__results__list__item__content">
			<p class="search__results__list__item__description">${item.values[0]}</p>
			${overloads}
		</div>
	</li>`;
}

const results = array<DataSearch>([]);

const value = signal('');

value.subscribe(search => {
	results.set(
		(data as DataSearch[]).filter(item => {
			if (item.name.original.includes(search)) {
				return true;
			}

			for (const itemValue of item.values) {
				if (includes(itemValue, search)) {
					return true;
				}
			}

			return false;
		}),
	);
});

const items = fragments(results as never, identifyItem, renderItem);

const emptyValue = computed(() => value.get().trim().length === 0);
const emptyResults = computed(() => results.get().length === 0);

const hideHint = computed(() => value.get().trim().length > 0);

const hideEmpty = computed(() => {
	const hasNoValue = emptyValue.get();
	const hasResults = !emptyResults.get();

	return hasNoValue || hasResults;
});

const hideResults = computed(() => {
	const hasValue = !emptyValue.get();
	const hasResults = !emptyResults.get();

	return !hasValue || !hasResults;
});

html`<oui-popover>
	<button
		oui-popover-toggle="oui-popover-toggle"
		class="oui-button oui-button--small"
		type="button"
	>
		Search
	</button>
	<div oui-popover-content="oui-popover-content" class="search__content">
		<h2 class="oui-vh">Search</h2>
		<form class="search__form" @submit="${onSubmit}">
			<div class="stack stack--small">
				<label class="oui-vh" for="search_input">Search term</label>
				<input
					autocomplete="off"
					class="oui-input"
					id="search_input"
					spellcheck="false"
					type="search"
					value="${value}"
				/>
			</div>
		</form>
		<hr />
		<div class="search__results">
			<p class="search__results__message" hidden="${hideHint}">
				Please enter a search term to see results
			</p>
			<p class="search__results__message" hidden="${hideEmpty}">There are no results</p>
			<ul class="search__results__list" hidden="${hideResults}">
				${items}
			</ul>
		</div>
	</div>
</oui-popover>`.appendTo(document.querySelector('#search')!);
