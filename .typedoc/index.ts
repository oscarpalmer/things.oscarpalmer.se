import {partition, select} from '@oscarpalmer/atoms/array';
import {toRecord} from '@oscarpalmer/atoms/array/to-record';
import abydonPackage from '@oscarpalmer/abydon/package.json' with {type: 'json'};
import atomsPackage from '@oscarpalmer/atoms/package.json' with {type: 'json'};
import {isNullableOrWhitespace} from '@oscarpalmer/atoms/is';
import {getString} from '@oscarpalmer/atoms/string';
import jhunalPackage from '@oscarpalmer/jhunal/package.json' with {type: 'json'};
import moraPackage from '@oscarpalmer/mora/package.json' with {type: 'json'};
import timerPackage from '@oscarpalmer/timer/package.json' with {type: 'json'};
import torettoPackage from '@oscarpalmer/toretto/package.json' with {type: 'json'};
import MarkdownIt from 'markdown-it';
import {copyFile, mkdir, writeFile} from 'node:fs/promises';
import {
	Application,
	type DeclarationReflection,
	type ProjectReflection,
	ReflectionKind,
} from 'typedoc';
import type {
	DataBlob,
	DataGenerated,
	DataItem,
	DataItemType,
	DataItemTypePlural,
	DataItemTypeSingular,
	DataMapped,
	DataName,
	DataPackage,
	DataSearch,
	DataSimpleDeclaration,
	DataValues,
} from './model';

const md = new MarkdownIt({
	html: true,
});

function compareItems(
	first: DataItem | DataSearch | DataSimpleDeclaration,
	second: DataItem | DataSearch | DataSimpleDeclaration,
): number {
	return first.name.original.localeCompare(second.name.original);
}

function getDeclarations(
	module: string,
	kind: ReflectionKind,
	owner: DeclarationReflection | ProjectReflection,
	prefix: string,
): DataValues<DataSimpleDeclaration> {
	const declarations = select(
		owner.getChildrenByKind(kind),
		declaration => {
			const {fullFileName} = declaration.sources![0];

			if (!fullFileName.includes(module)) {
				return false;
			}

			return !/node_modules\/.*?\/node_modules/.test(fullFileName);
		},
		declaration => {
			const name = getName(declaration.name);

			return {
				declaration,
				name,
				url: getUrl([prefix, getKinds(kind), name.slug]),
			};
		},
	);

	return {
		array: declarations,
		map: toRecord(declarations, item => item.name.original),
	};
}

function getGroup(key: DataItemTypeSingular, pkg: DataPackage, exp: DataItem): DataItem {
	const type = getType(key);

	return {
		type,
		export: exp.name,
		name: getName(type.plural),
		package: pkg.name,
		url: '',
	};
}

function getItem(
	type: DataItemType,
	exp: DataItem,
	owner: Pick<DataSimpleDeclaration, 'name'>,
): DataItem {
	return {
		type,
		export: exp.name,
		name: owner.name,
		package: exp.package,
		url: '',
	};
}

function getKinds(kind: ReflectionKind): string {
	switch (kind) {
		case ReflectionKind.Accessor:
			return 'accessors';

		case ReflectionKind.Class:
			return 'classes';

		case ReflectionKind.Constructor:
			return 'constructors';

		case ReflectionKind.Function:
			return 'functions';

		case ReflectionKind.Method:
			return 'methods';

		case ReflectionKind.SomeType:
			return 'models';

		case ReflectionKind.Property:
			return 'properties';

		case ReflectionKind.Variable:
			return 'variables';

		default:
			throw new Error(`Unknown kind: ${kind}`);
	}
}

function getMapped(exports: Record<string, unknown>): DataMapped[] {
	const entries = Object.entries(exports).filter(
		([, value]) => typeof value === 'object' && value !== null && 'default' in value,
	) as [string, {default: string}][];

	if (entries.length === 1) {
		return [mapper('', entries[0][1])!];
	}

	return entries
		.filter(([key]) => key !== '.')
		.map(([key, value]) => mapper(key, value))
		.filter(item => item != null);
}

function getName(original: string): DataName {
	return {
		original,
		slug: original.toLowerCase(),
	};
}

function getPlural(type: DataItemTypeSingular): DataItemTypePlural {
	switch (type) {
		case 'class':
			return 'classes';

		case 'property':
			return 'properties';

		default:
			return `${type}s` as DataItemTypePlural;
	}
}

function getUrl(parts: unknown[]): string {
	return `/${join(parts, '/')
		.replace(/\/+/g, '/')
		.replace(/^\/|\/$/g, '')}/`;
}

function join(parts: unknown[], separator: string): string {
	return parts
		.map(getString)
		.filter(part => !isNullableOrWhitespace(part))
		.join(separator);
}

function getType(type: DataItemTypeSingular): DataItemType {
	return {
		plural: getPlural(type),
		singular: type,
	};
}

function mapper(key: string, value: {default: string}): DataMapped | undefined {
	const path = value.default;

	if (typeof path !== 'string' || !path.endsWith('.mjs')) {
		return;
	}

	const normalized = path.replace(/^\.\/dist\/(.*)\.mjs$/, '$1');

	return {
		name: key,
		path: normalized,
	};
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

const all: Record<string, DataItem> = {};

const generated: DataGenerated = {
	classes: {
		accessors: [],
		constructors: [],
		groups: {
			multi: [],
			single: [],
		},
		methods: [],
		multi: [],
		properties: [],
		single: [],
		types: [getType('constructor'), getType('accessor'), getType('method'), getType('property')],
	},
	exports: {
		multi: [],
		single: [],
	},
	items: {
		classes: [],
		functions: [],
		groups: {
			multi: [],
			single: [],
		},
		models: [],
		multi: [],
		single: [],
		types: [getType('class'), getType('function'), getType('model'), getType('variable')],
		variables: [],
	},
	packages: {
		all: [],
		multi: [],
		single: [],
	},
};

const search: DataSearch[] = [];

const mapped = [
	{
		items: getMapped(abydonPackage.exports),
		name: 'abydon',
		pkg: abydonPackage,
		single: true,
	},
	{
		items: getMapped(atomsPackage.exports),
		name: 'atoms',
		pkg: atomsPackage,
		single: false,
	},
	{
		items: getMapped(jhunalPackage.exports),
		name: 'jhunal',
		pkg: jhunalPackage,
		single: true,
	},
	{
		items: getMapped(moraPackage.exports),
		name: 'mora',
		pkg: moraPackage,
		single: true,
	},
	{
		items: getMapped(timerPackage.exports),
		name: 'timer',
		pkg: timerPackage,
		single: false,
	},
	/* {
		items: getMapped(torettoPackage.exports),
		name: 'toretto',
		pkg: torettoPackage,
	}, */
];

const plugin = new URL('./plugin.ts', import.meta.url).pathname;

const types = {
	accessor: getType('accessor'),
	class: getType('class'),
	constructor: getType('constructor'),
	export: getType('export'),
	function: getType('function'),
	method: getType('method'),
	model: getType('model'),
	package: getType('package'),
	property: getType('property'),
	variable: getType('variable'),
};

for (const map of mapped) {
	const module = `@oscarpalmer/${map.name}`;

	console.log(` - Generating data for ${module}`);

	const name = getName(map.name);

	const pkg: DataPackage = {
		name,
		exports: [],
		json: map.pkg,
		url: getUrl([name.slug]),
	};

	const parentExports = new Map<string, DataItem>();
	const parentDataBlobs = new Map<string, DataBlob>();

	for (const item of map.items) {
		console.log(`   - Generating data for ${module}/${item.path}`);

		await mkdir(`./data/generated/${map.name}/${item.name}`, {recursive: true});

		const typedoc = await Application.bootstrapWithPlugins({
			entryPoints: [`./node_modules/@oscarpalmer/${map.name}/src/${item.path}.ts`],
			logLevel: 'Error',
			plugin: [plugin],
			tsconfig: './tsconfig.json',
		});

		const project = await typedoc.convert();

		if (project == null) {
			console.log('   × Failed to generate typedoc-data');

			continue;
		}

		console.log('     ✓ Generated typedoc-data');

		const name = item.name.replace(/^\.\//, '');
		const parentSlug = name.split('/')[0];
		const isSubExport = name !== parentSlug;

		let exp: DataItem;
		let exportName: DataName;
		let exportUrl: string;

		if (isSubExport && parentExports.has(parentSlug)) {
			exp = parentExports.get(parentSlug)!;

			exportName = exp.name;
			exportUrl = exp.url;
		} else {
			exportName = getName(isSubExport ? parentSlug : name);
			exportUrl = getUrl([pkg.name.slug, exportName.slug]);

			exp = {
				export: exportName,
				name: exportName,
				package: pkg.name,
				type: types.export,
				url: exportUrl,
			};
		}

		const data: DataBlob = {
			classes: {
				array: [],
				map: {},
			},
			functions: getDeclarations(module, ReflectionKind.Function, project, exportUrl),
			models: getDeclarations(module, ReflectionKind.SomeType, project, exportUrl),
			variables: getDeclarations(module, ReflectionKind.Variable, project, exportUrl),
		};

		if (
			data.functions.array.length === 0 &&
			data.models.array.length === 0 &&
			data.variables.array.length === 0
		) {
			console.log('   × No declarations found');

			continue;
		}

		if (!(isSubExport && parentExports.has(parentSlug))) {
			pkg.exports.push(exp);

			if (map.single) {
				generated.exports.single.push(exp);
			} else {
				generated.exports.multi.push(exp);
			}

			parentExports.set(parentSlug, exp);

			parentDataBlobs.set(parentSlug, {
				classes: {array: [], map: {}},
				functions: {array: [], map: {}},
				models: {array: [], map: {}},
				variables: {array: [], map: {}},
			});
		}

		console.log('     ✓ Generated base declarations');

		const functions = data.functions.array.map(fn => ({
			...getItem(types.function, exp, fn),
			declaration: fn,
			url: getUrl([exportUrl, types.function.plural, fn.name.slug]),
		}));

		const [models, modelClasses] = partition(
			data.models.array.map(model => ({
				...getItem(types.model, exp, model),
				declaration: model,
				url: getUrl([exportUrl, types.model.plural, model.name.slug]),
			})),
			item => item.declaration.declaration.kind !== ReflectionKind.Interface,
		);

		data.models.array = models.map(model => model.declaration);
		data.models.map = toRecord(data.models.array, item => item.name.original);

		const variables = data.variables.array.map(variable => ({
			...getItem(types.variable, exp, variable),
			declaration: variable,
			url: getUrl([exportUrl, types.variable.plural, variable.name.slug]),
		}));

		const allItems: DataItem[] = [...functions, ...models, ...variables];

		if (map.single) {
			generated.items.single.push(...allItems);
		} else {
			generated.items.multi.push(...allItems);
		}

		generated.items.functions.push(...functions);
		generated.items.models.push(...models);
		generated.items.variables.push(...variables);

		if (!isSubExport) {
			const groups = [
				getGroup('class', pkg, exp),
				getGroup('function', pkg, exp),
				getGroup('model', pkg, exp),
				getGroup('variable', pkg, exp),
			];

			if (map.single) {
				generated.items.groups.single.push(...groups);
			} else {
				generated.items.groups.multi.push(...groups);
			}
		}

		for (const item of allItems) {
			const url = getUrl([exportUrl, item.type.plural, item.name.slug]);

			all[url] = item;

			search.push({
				url,
				name: item.name,
				package: item.package,
				values: [
					...(item.declaration?.declaration.signatures?.map(sig =>
						renderMarkdown(sig.comment?.summary?.map(sum => sum.text) ?? []).replace(
							/^\s+|\s+$/g,
							'',
						),
					) ?? []),
				],
			});

			item.declaration = undefined;
		}

		console.log('     ✓ Generated declaration items');

		const classes = [
			...(modelClasses.map(cls => cls.declaration.declaration) as DeclarationReflection[]),
			...project.getChildrenByKind(ReflectionKind.Class),
		];

		for (const cls of classes) {
			const className = getName(cls.name);
			const classUrl = getUrl([exportUrl, 'classes', className.slug]);

			const classItem = {
				...getItem(types.class, exp, {
					name: className,
				}),
				url: classUrl,
			};

			const accessors = getDeclarations(module, ReflectionKind.Accessor, cls, classUrl);
			const constructors = getDeclarations(module, ReflectionKind.Constructor, cls, classUrl);
			const methods = getDeclarations(module, ReflectionKind.Method, cls, classUrl);
			const properties = getDeclarations(module, ReflectionKind.Property, cls, classUrl);

			if (
				accessors.array.length === 0 &&
				constructors.array.length === 0 &&
				methods.array.length === 0 &&
				properties.array.length === 0
			) {
				continue;
			}

			data.classes.array.push(classItem);

			if (map.single) {
				generated.items.single.push(classItem);
			} else {
				generated.items.multi.push(classItem);
			}

			generated.items.classes.push(classItem);

			all[classUrl] = classItem;

			data.classes.map[cls.name] = {
				accessors,
				constructors,
				methods,
				properties,
				self: {
					declaration: cls,
					name: className,
					url: classUrl,
				},
			};

			const accessorItems = accessors.array.map(accessor => ({
				...getItem(types.accessor, exp, accessor),
				class: classItem,
				url: getUrl([classUrl, types.accessor.plural, accessor.name.slug]),
			}));

			const constructorItems = constructors.array.map(ctor => ({
				...getItem(types.constructor, exp, ctor),
				class: classItem,
				url: getUrl([classUrl, types.constructor.plural, ctor.name.slug]),
			}));

			const methodItems = methods.array.map(method => ({
				...getItem(types.method, exp, method),
				class: classItem,
				url: getUrl([classUrl, types.method.plural, method.name.slug]),
			}));

			const propertyItems = properties.array.map(property => ({
				...getItem(types.property, exp, property),
				class: classItem,
				url: getUrl([classUrl, types.property.plural, property.name.slug]),
			}));

			generated.classes.accessors.push(...accessorItems);
			generated.classes.constructors.push(...constructorItems);
			generated.classes.methods.push(...methodItems);
			generated.classes.properties.push(...propertyItems);

			const classesItems = [
				...accessorItems,
				...constructorItems,
				...methodItems,
				...propertyItems,
			];

			if (map.single) {
				generated.classes.single.push(...classesItems);
			} else {
				generated.classes.multi.push(...classesItems);
			}

			const groups = [
				{
					class: classItem,
					...getGroup('accessor', pkg, exp),
				},
				{
					class: classItem,
					...getGroup('constructor', pkg, exp),
				},
				{
					class: classItem,
					...getGroup('method', pkg, exp),
				},
				{
					class: classItem,
					...getGroup('property', pkg, exp),
				},
			];

			if (map.single) {
				generated.classes.groups.single.push(...groups);
			} else {
				generated.classes.groups.multi.push(...groups);
			}

			const allItems = [...accessorItems, ...constructorItems, ...methodItems, ...propertyItems];

			for (const item of allItems) {
				const url = getUrl([
					exportUrl,
					'classes',
					className.slug,
					item.type.plural,
					item.name.slug,
				]);

				all[url] = item;

				search.push({
					url,
					class: classItem.name,
					name: item.name,
					package: item.package,
					values: [
						...(item.declaration?.declaration.signatures?.map(sig =>
							renderMarkdown(sig.comment?.summary?.map(sum => sum.text) ?? []).replace(
								/^\s+|\s+$/g,
								'',
							),
						) ?? []),
					],
				});

				item.declaration = undefined;
			}
		}

		if (classes.length > 0) {
			console.log('     ✓ Generated class declarations and items');
		}

		const parentData = parentDataBlobs.get(parentSlug)!;

		for (const key of ['functions', 'models', 'variables'] as const) {
			parentData[key].array.push(...data[key].array);

			Object.assign(parentData[key].map, data[key].map);
		}

		parentData.classes.array.push(...data.classes.array);

		Object.assign(parentData.classes.map, data.classes.map);

		for (const [key, value] of Object.entries(data)) {
			value.array.sort(compareItems);

			await writeFile(
				`./data/generated/${map.name}/${name}/${key}.js`,
				`export default ${JSON.stringify(value)};`,
				{
					encoding: 'utf8',
				},
			);
		}

		console.log(`   ✓ Generated data for ${module}/${item.path}`);
	}

	for (const [slug, data] of parentDataBlobs) {
		for (const [key, value] of Object.entries(data)) {
			if (value.array.length === 0) {
				continue;
			}

			value.array.sort(compareItems);

			await writeFile(
				`./data/generated/${map.name}/${slug}/${key}.js`,
				`export default ${JSON.stringify(value)};`,
				{encoding: 'utf8'},
			);
		}
	}

	generated.packages.all.push(pkg);

	if (map.single) {
		generated.packages.single.push(pkg);
	} else {
		generated.packages.multi.push(pkg);
	}

	console.log(` ✓ Finished generating data for ${module}`);
}

console.log(' - Writing data to files');

await writeFile('./data/generated/all.js', `export default ${JSON.stringify(all)};`, {
	encoding: 'utf8',
});

for (const [key, value] of Object.entries(generated)) {
	if (Array.isArray(value)) {
		value.sort((first, second) => first.name.original.localeCompare(second.name.original));
	}

	await writeFile(`./data/generated/${key}.js`, `export default ${JSON.stringify(value)};`, {
		encoding: 'utf8',
	});
}

search.sort(compareItems);

await writeFile('./data/generated/search.js', `export default ${JSON.stringify(search)};`, {
	encoding: 'utf8',
});

await copyFile('./data/generated/search.js', './source/assets/javascript/data.js');

console.log(' ✓ Finished writing data');
console.log(' ✓ All done!');
