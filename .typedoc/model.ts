import type {DeclarationReflection} from 'typedoc/models';

export type Breadcrumb = {
	readonly label: string;
	readonly url: string;
};

export type DataBlob = {
	readonly classes: DataValues<DataItem, DataClassDeclaration>;
	readonly functions: DataValues<DataSimpleDeclaration>;
	readonly models: DataValues<DataSimpleDeclaration>;
	readonly variables: DataValues<DataSimpleDeclaration>;
};

export type DataClassDeclaration = {
	readonly accessors: DataValues<DataSimpleDeclaration>;
	readonly constructors: DataValues<DataSimpleDeclaration>;
	readonly methods: DataValues<DataSimpleDeclaration>;
	readonly properties: DataValues<DataSimpleDeclaration>;
	readonly name: DataName;
};

export type DataClassItem = {
	readonly class: DataItem;
} & DataItem;

export type DataValues<Item, Mapped = Item> = {
	array: Item[];
	map: Record<string, Mapped>;
};

export type DataGenerated = {
	readonly classes: DataGeneratedClasses;
	readonly exports: DataGeneratedExports;
	readonly items: DataGeneratedItems;
	readonly packages: DataGeneratedPackages;
};

export type DataGeneratedClasses = {
	readonly accessors: DataClassItem[];
	readonly constructors: DataClassItem[];
	readonly groups: DataGeneratedClassesGroups;
	readonly methods: DataClassItem[];
	readonly multi: DataClassItem[];
	readonly properties: DataClassItem[];
	readonly single: DataClassItem[];
	readonly types: DataItemType[];
};

export type DataGeneratedClassesGroups = {
	readonly multi: DataClassItem[];
	readonly single: DataClassItem[];
};

export type DataGeneratedExports = {
	readonly multi: DataItem[];
	readonly single: DataItem[];
};

export type DataGeneratedItems = {
	readonly classes: DataItem[];
	readonly functions: DataItem[];
	readonly groups: DataGeneratedItemsGroups;
	readonly models: DataItem[];
	readonly multi: DataItem[];
	readonly single: DataItem[];
	readonly types: DataItemType[];
	readonly variables: DataItem[];
};

export type DataGeneratedItemsGroups = {
	readonly multi: DataItem[];
	readonly single: DataItem[];
};

export type DataGeneratedPackages = {
	readonly all: DataPackage[];
	readonly multi: DataPackage[];
	readonly single: DataPackage[];
};

export type DataItem = {
	declaration?: DataSimpleDeclaration;
	readonly export: DataName;
	readonly name: DataName;
	readonly package: DataName;
	readonly type: DataItemType;
	readonly url: string;
};

export type DataItemType = {
	readonly plural: DataItemTypePlural;
	readonly singular: DataItemTypeSingular;
};

export type DataItemTypePlural =
	| 'accessors'
	| 'classes'
	| 'constructors'
	| 'exports'
	| 'functions'
	| 'methods'
	| 'models'
	| 'packages'
	| 'properties'
	| 'variables';

export type DataItemTypeSingular =
	| 'accessor'
	| 'class'
	| 'constructor'
	| 'export'
	| 'function'
	| 'method'
	| 'model'
	| 'package'
	| 'property'
	| 'variable';

export type DataMapped = {
	readonly name: string;
	readonly path: string;
};

export type DataName = {
	readonly original: string;
	readonly slug: string;
};

export type DataPackage = {
	readonly exports: DataItem[];
	readonly name: DataName;
	readonly json: Record<string, unknown>;
};

export type DataSearch = {
	readonly name: DataName;
	readonly package: DataName;
	readonly url: string;
	readonly values: string[];
};

export type DataSimpleDeclaration = {
	code?: unknown[];
	declaration: {
		signatures?: DeclarationReflection['signatures'];
	};
	name: DataName;
	url: string;
};
