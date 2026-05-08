import {
	array,
	computed,
	fragments,
	html,
	signal,
	type Computed,
	type Fragment,
	type Fragments,
	type ReactiveArray,
	type Signal,
} from '@oscarpalmer/abydon';
import {includes} from '@oscarpalmer/atoms/string/match';
import '@oscarpalmer/oui/popover';
import type {DataSearch} from '../../../.typedoc/model';
import data from './data.js';

// #region Types

type Empty = {
	array: Computed<boolean>;
	value: Computed<boolean>;
};

type Hide = {
	empty: Computed<boolean>;
	fragments: Computed<boolean>;
	hint: Computed<boolean>;
	truncation: Signal<boolean>;
};

type Search = {
	array: ReactiveArray<SearchItem>;
	count: Signal<number>;
	fragments: Fragments;
	original: SearchItem[];
	value: Signal<string>;
};

type SearchItem = {
	fragment?: Fragment;
} & DataSearch;

// #endregion

// #region Functions

function identifyItem(item: SearchItem): string {
	return item.url;
}

function onSubmit(event: SubmitEvent): void {
	event.preventDefault();
}

function renderItem(item: SearchItem): Fragment {
	if (item.fragment != null) {
		return item.fragment;
	}

	let klass = '';
	let overloads = '';

	if (item.class != null) {
		klass = `<span class="oui-tag oui-tag--purple oui-tag--tiny">${item.class.original}</span>`;
	}

	if (item.values.length > 1) {
		overloads = `<p class="search__results__list__item__overloads">(+ ${item.values.length - 1} overloads)</p>`;
	}

	const fragment = html`<li class="stack stack--small search__results__list__item">
		<header class="flow search__results__list__item__header">
			<h3 class="fill search__results__list__item__title">
				<a href="${item.url}">${item.name.original}</a>
			</h3>
			${klass}
			<span class="oui-tag oui-tag--blue oui-tag--tiny">@oscarpalmer/${item.package.original}</span>
		</header>
		<div class="stack stack--text search__results__list__item__content">
			<p class="search__results__list__item__description">${item.values[0]}</p>
			${overloads}
		</div>
	</li>`;

	item.fragment = fragment;

	return fragment;
}

// #endregion

// #region Variables

const search: Search = {
	array: array<SearchItem>([]),
	count: signal(0),
	fragments: undefined as never as Fragments,
	original: data as SearchItem[],
	value: signal(''),
};

const empty: Empty = {
	array: computed(() => search.array.get().length === 0),
	value: computed(() => search.value.get().trim().length === 0),
};

const hide: Hide = {
	empty: computed(() => {
		const hasNoValue = empty.value.get();
		const hasResults = !empty.array.get();

		return hasNoValue || hasResults;
	}),
	fragments: computed(() => {
		const hasValue = !empty.value.get();
		const hasResults = !empty.array.get();

		return !hasValue || !hasResults;
	}),
	hint: computed(() => !empty.value.get()),
	truncation: signal(true),
};

search.fragments = fragments(search.array, identifyItem, renderItem);

search.value.subscribe(value => {
	const filtered = search.original.filter(item => {
		if (value.length === 0) {
			return false;
		}

		if (item.name.original.includes(value)) {
			return true;
		}

		for (const itemValue of item.values) {
			if (includes(itemValue, value)) {
				return true;
			}
		}

		return false;
	});

	const {length} = filtered;

	search.count.set(length);

	hide.truncation.set(length <= 25);

	search.array.set(filtered.splice(0, 25));
});

// #endregion

// #region Render

html`<h1 class="oui-vh">Search</h1>
	<form class="search__form" @submit="${onSubmit}">
		<div class="stack stack--small">
			<label class="oui-vh" for="search_input">Search term</label>
			<input
				autocomplete="off"
				class="oui-input"
				id="search_input"
				spellcheck="false"
				type="search"
				value="${search.value}"
			/>
		</div>
	</form>
	<hr />
	<div class="search__results">
		<p class="search__results__message" hidden="${hide.hint}">
			Please enter a search term to see results
		</p>
		<p class="search__results__message" hidden="${hide.empty}">There are no results</p>
		<p
			class="search__results__message search__results__message--truncation"
			hidden="${hide.truncation}"
		>
			Showing ${() => search.array.length} results <i>(of ${search.count})</i>
		</p>
		<ul class="search__results__list" hidden="${hide.fragments}">
			${search.fragments}
		</ul>
	</div>`.appendTo(document.querySelector('#search')!);

// #endregion
