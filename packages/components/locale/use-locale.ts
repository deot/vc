import { computed, unref } from 'vue';
import type { MaybeRef } from 'vue';
import type { Language } from '@deot/vc-locale';
import { VcInstance } from '../vc';

export type LocaleKey = `vc.${string}`;
export type TranslatorOption = Record<string, string | number>;
export type Translator = (path: LocaleKey, options?: TranslatorOption) => string;

export const translate = (
	path: LocaleKey,
	options: TranslatorOption | undefined,
	locale: Language
): string => {
	let value: unknown = locale;

	for (const key of path.split('.')) {
		if (!value || typeof value !== 'object') return path;
		value = (value as Record<string, unknown>)[key];
	}

	if (typeof value !== 'string') return path;

	return value.replace(/\{(\w+)\}/g, (_, key: string) => {
		return `${options?.[key] ?? `{${key}}`}`;
	});
};

export const buildTranslator = (locale: MaybeRef<Language>): Translator => {
	return (path, options) => {
		return translate(path, options, unref(locale));
	};
};

export const useLocale = () => {
	const locale = computed(() => VcInstance.options.locale);
	const lang = computed(() => locale.value.name);
	const t = buildTranslator(locale);

	return {
		locale,
		lang,
		t
	};
};
