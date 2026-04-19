import {
	type Application,
	type Context,
	Converter,
	type DeclarationReflection,
	type Reflection,
	ReflectionKind,
	type SignatureReflection,
} from 'typedoc';
import ts from 'typescript';

function getCode(declaration: ts.Declaration): string {
	const start = ts.getLineAndCharacterOfPosition(
		declaration.getSourceFile(),
		getNode(declaration).getStart(),
	);

	const end = ts.getLineAndCharacterOfPosition(
		declaration.getSourceFile(),
		getNode(declaration).getEnd(),
	);

	const source = declaration?.getSourceFile().getFullText();
	const lines = source?.split('\n') ?? [];

	return lines?.slice(start.line, end.line + 1).join('\n') ?? '';
}

function getDeclarations(
	context: Context,
	reflection: Reflection,
	signature?: ts.SignatureDeclaration,
): ts.Declaration[] {
	const symbol =
		signature != null && reflection.parent != null
			? context.getSymbolFromReflection(reflection.parent)
			: context.getSymbolFromReflection(reflection);

	return symbol?.declarations ?? [];
}

function getNode(declaration: ts.Declaration) {
	return ts.isVariableDeclaration(declaration)
		? declaration.parent
		: declaration;
}

function handle(
	context: Context,
	reflection: Reflection,
	signature?: ts.SignatureDeclaration,
) {
	if (reflection.isProject()) {
		return;
	}

	(reflection as any).code = {
		items: [],
		source: '',
	};

	const declarations =
		signature == null ? getDeclarations(context, reflection) : [signature];

	if (declarations.length === 0) {
		return;
	}

	let code: string | undefined;

	for (const declaration of declarations) {
		code = getCode(declaration);

		(reflection as any).code.items.push(trimCode(code));
		(reflection as any).code.source = code;
	}

	if (reflection.parent != null && (reflection.parent as any).code == null) {
		(reflection.parent as any).code = {
			items: [],
			source: code,
		};
	}
}

export function load(application: Application): void {
	application.converter.on(
		Converter.EVENT_CREATE_DECLARATION,
		(context: Context, reflection: DeclarationReflection) => {
			if (shouldParseDeclaration(context, reflection)) {
				handle(context, reflection);
			}
		},
	);

	application.converter.on(
		Converter.EVENT_CREATE_SIGNATURE,
		(
			context: Context,
			reflection: SignatureReflection,
			signature?: unknown,
		): void => {
			if (shouldParseSignature(context, reflection)) {
				handle(context, reflection, signature as ts.SignatureDeclaration);
			}
		},
	);
}

function shouldParseDeclaration(
	context: Context,
	reflection: DeclarationReflection,
): boolean {
	const symbol = context.getSymbolFromReflection(reflection);

	if (
		kinds.has(reflection.kind) ||
		symbol?.valueDeclaration?.kind !== ts.SyntaxKind.FunctionDeclaration
	) {
		return true;
	}

	return (symbol?.declarations?.length ?? 0) > 1;
}

function shouldParseSignature(
	context: Context,
	reflection: SignatureReflection,
): boolean {
	const symbol = context.getSymbolFromReflection(reflection?.parent);

	return (
		symbol?.valueDeclaration?.kind === ts.SyntaxKind.FunctionDeclaration ||
		symbol?.valueDeclaration?.kind === ts.SyntaxKind.MethodDeclaration
	);
}

function trimCode(code: string): string {
	return code.replace(/\s*\{[\s\S]+\}\s*$/, ';');
}

const kinds = new Set([
	ReflectionKind.Enum,
	ReflectionKind.Variable,
	ReflectionKind.Class,
	ReflectionKind.Interface,
	ReflectionKind.TypeAlias,
]);
