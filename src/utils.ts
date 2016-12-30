import { isBlockLike, isComputedPropertyName, isIdentifier, isIfStatement, isLiteralExpression } from './typeguard';
import * as ts from 'typescript';
import * as Lint from 'tslint';

export function isParameterProperty(node: ts.ParameterDeclaration): boolean {
    return Lint.hasModifier(node.modifiers,
                            ts.SyntaxKind.PublicKeyword,
                            ts.SyntaxKind.ProtectedKeyword,
                            ts.SyntaxKind.PrivateKeyword,
                            ts.SyntaxKind.ReadonlyKeyword);
}

export function hasAccessModifier(node: ts.Node): boolean {
    return Lint.hasModifier(node.modifiers,
                            ts.SyntaxKind.PublicKeyword,
                            ts.SyntaxKind.ProtectedKeyword,
                            ts.SyntaxKind.PrivateKeyword);
}

function bindingPatternContains(pattern: ts.BindingPattern, name: string, ignoreDefaults?: boolean): boolean {
    for (let element of pattern.elements) {
        if (element.kind !== ts.SyntaxKind.BindingElement)
            continue;

        const bindingElement = <ts.BindingElement>element;
        // defaulting to undefined is not really a default -> check for undefined and void initializer
        if (ignoreDefaults && bindingElement.initializer !== undefined && !isUndefined(bindingElement.initializer))
            continue;

        if (bindingNameContains(bindingElement.name, name, ignoreDefaults))
            return true;
    }
    return false;
}

export function bindingNameContains(bindingName: ts.BindingName, name: string, ignoreDefaults?: boolean): boolean {
    return isIdentifier(bindingName) ?
           bindingName.text === name :
           bindingPatternContains(bindingName, name, ignoreDefaults);
}

export function isUndefined(expression: ts.Expression): boolean {
    return isIdentifier(expression) && expression.text === 'undefined' ||
        expression.kind === ts.SyntaxKind.VoidExpression;
}

export function getPreviousStatement(statement: ts.Statement): ts.Statement|undefined {
    const parent = statement.parent!;
    if (isBlockLike(parent)) {
        const index = parent.statements.indexOf(statement);
        if (index > 0)
            return parent.statements[index - 1];
    }
}

export function getNextStatement(statement: ts.Statement): ts.Statement|undefined {
    const parent = statement.parent!;
    if (isBlockLike(parent)) {
        const index = parent.statements.indexOf(statement);
        if (index < parent.statements.length)
            return parent.statements[index + 1];
    }
}

export function getChildOfKind(node: ts.Node, kind: ts.SyntaxKind, sourceFile?: ts.SourceFile): ts.Node|undefined {
    const children = node.getChildren(sourceFile);
    for (let child of children) {
        if (child.kind === kind)
            return child;
    }
}

export function getPropertyName(propertyName: ts.PropertyName|ts.LiteralExpression): string|undefined {
    if (isIdentifier(propertyName))
        return propertyName.text;
    if (isComputedPropertyName(propertyName)) {
        if (!isLiteralExpression(propertyName.expression))
            return;
        propertyName = propertyName.expression;
    }
    return propertyName.text;
}

export function isElseIf(node: ts.IfStatement): boolean {
    const parent = node.parent!;
    return isIfStatement(parent) &&
         parent.elseStatement === node;
}

export function endsThisContext(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.FunctionDeclaration ||
           node.kind === ts.SyntaxKind.FunctionExpression ||
           node.kind === ts.SyntaxKind.ClassDeclaration ||
           node.kind === ts.SyntaxKind.ClassExpression;
}

export let isScopeBoundary = (class extends Lint.ScopeAwareRuleWalker<void> {
    public createScope() { return this; }
    public static getFn() {
        return this.prototype.isScopeBoundary;
    }
}).getFn();
