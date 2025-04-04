import ResolvableModule from './resolvable-module';

export default function isResolvableModule<TModule, TIdentifier>(
    module: TModule,
): module is ResolvableModule<TModule, TIdentifier> {
    return module && 'resolveIds' in module;
}
