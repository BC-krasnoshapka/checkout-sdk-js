import { Logger, NoopLogger } from '../common/log';

import LanguageConfig from './language-config';
import LanguageService from './language-service';

describe('LanguageService', () => {
    let config: Partial<LanguageConfig>;
    let langService: LanguageService;
    let logger: Logger;

    beforeEach(() => {
        config = {
            locale: 'en',
            defaultTranslations: {
                optimized_checkout: {
                    test: {
                        customer_heading: 'Customer',
                        greeting_text: 'Welcome {name}',
                    },
                },
            },
            translations: {
                'optimized_checkout.test.item_count_text':
                    '{count, plural, one{1 Item} other{# Items}}',
                'optimized_checkout.test.continue_as_guest_action': 'Continue as guest',
                'optimized_checkout.test.email_label': 'Email Address',
                'optimized_checkout.test.order_number_text': 'Your order number is {orderNumber}',
                'optimized_checkout.test.thank_you_text': '<strong>Thank you<strong>',
                'optimized_checkout.test.link_single_quote_text':
                    "Check <a href='/terms-and-conditions/' target='blank'>T&C</a>",
                'optimized_checkout.test.escape_text': "Copy this code '{abc}'",
            },
        };

        logger = new NoopLogger();

        jest.spyOn(logger, 'warn');

        langService = new LanguageService(config, logger);
    });

    it('has methods that can be destructed', () => {
        const { translate } = langService;

        expect(() => translate('test.continue_as_guest_action')).not.toThrow(TypeError);
    });

    describe('#translate()', () => {
        it('returns translated strings', () => {
            expect(langService.translate('test.continue_as_guest_action')).toBe(
                'Continue as guest',
            );
            expect(langService.translate('test.order_number_text', { orderNumber: '12345' })).toBe(
                'Your order number is 12345',
            );
        });

        it('returns translated HTML strings', () => {
            expect(langService.translate('test.thank_you_text')).toBe('<strong>Thank you<strong>');
        });

        it('returns translated HTML strings with special ICU characters', () => {
            expect(langService.translate('test.link_single_quote_text')).toBe(
                "Check <a href='/terms-and-conditions/' target='blank'>T&C</a>",
            );
        });

        it('returns translated text with escaped characters', () => {
            expect(langService.translate('test.escape_text')).toBe('Copy this code {abc}');
        });

        it('returns template string when values are missing for template variables', () => {
            expect(langService.translate('test.order_number_text')).toBe(
                'Your order number is {orderNumber}',
            );
        });

        it('pluralizes strings using ICU format', () => {
            expect(langService.translate('test.item_count_text', { count: 0 })).toBe('0 Items');
            expect(langService.translate('test.item_count_text', { count: 1 })).toBe('1 Item');
            expect(langService.translate('test.item_count_text', { count: 10 })).toBe('10 Items');
        });

        it('supports non-English pluralization rules', () => {
            config = {
                locale: 'cs',
                translations: {
                    'optimized_checkout.test.days_text':
                        '{count, plural, one{1 den} few{# dny} many{# dne} other{# dní} }',
                },
            };

            langService = new LanguageService(config, logger);

            expect(langService.translate('test.days_text', { count: 1 })).toBe('1 den');
            expect(langService.translate('test.days_text', { count: 2 })).toBe('2 dny');
            expect(langService.translate('test.days_text', { count: 1.5 })).toBe('1,5 dne');
            expect(langService.translate('test.days_text', { count: 100 })).toBe('100 dní');
        });

        it('supports multiple locales', () => {
            config = {
                locale: 'fr',
                locales: {
                    'optimized_checkout.test.direction_text': 'fr', // French has less ordinals than English
                    'optimized_checkout.test.position_text': 'en',
                },
                translations: {
                    'optimized_checkout.test.direction_text':
                        'Prenez la {count, selectordinal, one{#re} other{#e}} à droite',
                    'optimized_checkout.test.position_text':
                        '{count, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} position',
                },
            };

            langService = new LanguageService(config, logger);

            expect(langService.translate('test.direction_text', { count: 1 })).toBe(
                'Prenez la 1re à droite',
            );
            expect(langService.translate('test.direction_text', { count: 2 })).toBe(
                'Prenez la 2e à droite',
            );
            expect(langService.translate('test.direction_text', { count: 3 })).toBe(
                'Prenez la 3e à droite',
            );
            expect(langService.translate('test.position_text', { count: 1 })).toBe('1st position');
            expect(langService.translate('test.position_text', { count: 2 })).toBe('2nd position');
            expect(langService.translate('test.position_text', { count: 3 })).toBe('3rd position');
        });

        it('should return default translations if user-preferred language file is not available', () => {
            expect(langService.translate('test.customer_heading')).toBe('Customer');
            expect(langService.translate('test.greeting_text', { name: 'David' })).toBe(
                'Welcome David',
            );
        });

        it('should return the translation key if both custom and default translation is missing', () => {
            expect(langService.translate('test.random')).toBe('optimized_checkout.test.random');
        });

        it('returns custom translations if defined, otherwise use default and then fallback translations', () => {
            config = {
                translations: {
                    optimized_checkout: {
                        test: {
                            greeting_text: 'Good morning',
                        },
                    },
                },
                defaultTranslations: {
                    optimized_checkout: {
                        test: {
                            greeting_text: 'Morning',
                            hello_text: 'Hello',
                        },
                    },
                },
                fallbackTranslations: {
                    optimized_checkout: {
                        test: {
                            greeting_text: 'Good day',
                            hello_text: 'Hi',
                            goodbye_text: 'Goodbye',
                        },
                    },
                },
            };

            langService = new LanguageService(config, logger);

            expect(langService.translate('test.greeting_text')).toBe('Good morning');
            expect(langService.translate('test.hello_text')).toBe('Hello');
            expect(langService.translate('test.goodbye_text')).toBe('Goodbye');
        });

        it('formats default and fallback strings based on locale specified', () => {
            config = {
                ...config,
                defaultLocale: 'fr', // French has less ordinals than English
                defaultTranslations: {
                    optimized_checkout: {
                        test: {
                            direction_text:
                                'Prenez la {count, selectordinal, one{#re} other{#e}} à droite',
                        },
                    },
                },
                fallbackLocale: 'en',
                fallbackTranslations: {
                    optimized_checkout: {
                        test: {
                            position_text:
                                '{count, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} position',
                        },
                    },
                },
            };

            langService = new LanguageService(config, logger);

            expect(langService.translate('test.direction_text', { count: 1 })).toBe(
                'Prenez la 1re à droite',
            );
            expect(langService.translate('test.direction_text', { count: 2 })).toBe(
                'Prenez la 2e à droite',
            );
            expect(langService.translate('test.direction_text', { count: 3 })).toBe(
                'Prenez la 3e à droite',
            );
            expect(langService.translate('test.position_text', { count: 1 })).toBe('1st position');
            expect(langService.translate('test.position_text', { count: 2 })).toBe('2nd position');
            expect(langService.translate('test.position_text', { count: 3 })).toBe('3rd position');
        });
    });

    describe('#getLocale()', () => {
        it('returns the theme locale if the current theme provides translations for UCO', () => {
            config = {
                locale: 'zh-TW',
                locales: {
                    'optimized_checkout.test.direction_text': 'zh',
                    'optimized_checkout.test.position_text': 'en',
                },
                translations: {
                    'optimized_checkout.test.direction_text': 'direction_text',
                    'optimized_checkout.test.position_text': 'position_text',
                },
            };

            langService = new LanguageService(config, logger);

            expect(langService.getLocale()).toBe('zh-TW');
        });

        it('returns the default locale if the current theme does not provide translations for UCO', () => {
            config = {
                locale: 'zh',
                locales: {
                    'optimized_checkout.test.direction_text': 'en',
                    'optimized_checkout.test.position_text': 'en',
                },
                translations: {
                    'optimized_checkout.test.direction_text': 'direction_text',
                    'optimized_checkout.test.position_text': 'position_text',
                },
            };

            langService = new LanguageService(config, logger);

            expect(langService.getLocale()).toBe('en');
        });
    });

    describe('#mapKeys()', () => {
        it('sets up an alias by mapping one language key to another', () => {
            langService.mapKeys({
                'mydirective.text': 'test.email_label',
            });

            const result = langService.translate('mydirective.text');
            const expected = langService.translate('test.email_label');

            expect(result).toEqual(expected);
        });

        it('sets up an alias that works with template variables', () => {
            const name = 'Andrea';

            langService.mapKeys({
                'mydirective.text': 'test.greeting_text',
            });

            const result = langService.translate('mydirective.text', { name });
            const expected = langService.translate('test.greeting_text', { name });

            expect(result).toEqual(expected);
            expect(result).toContain(name);
        });
    });
});
