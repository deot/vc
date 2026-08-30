import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import {
	buildTranslator,
	translate,
	useLocale,
	VcInstance
} from '@deot/vc-components';
import { zhCN } from '@deot/vc-locale';
import type { Language } from '@deot/vc-locale';

const firstLocale: Language = {
	name: 'first',
	vc: {
		sample: {
			message: 'Hello {name}',
			count: '{count} items',
			items: ['one'],
			group: {
				label: 'Group'
			}
		}
	}
};

const secondLocale: Language = {
	name: 'second',
	vc: {
		sample: {
			message: 'Hi {name}'
		}
	}
};

describe('locale', () => {
	afterEach(() => {
		VcInstance.configure({ locale: zhCN });
	});

	it('translates nested keys and placeholders', () => {
		expect(translate('vc.sample.message', { name: 'VC' }, firstLocale)).toBe('Hello VC');
		expect(translate('vc.sample.count', { count: 2 }, firstLocale)).toBe('2 items');
		expect(translate('vc.sample.message', undefined, firstLocale)).toBe('Hello {name}');
	});

	it('returns the path for missing or non-string values', () => {
		expect(translate('vc.sample.missing', undefined, firstLocale)).toBe('vc.sample.missing');
		expect(translate('vc.sample.group', undefined, firstLocale)).toBe('vc.sample.group');
		expect(translate('vc.sample.items', undefined, firstLocale)).toBe('vc.sample.items');
	});

	it('builds a translator from a reactive locale', () => {
		const locale = ref(firstLocale);
		const t = buildTranslator(locale);

		expect(t('vc.sample.message', { name: 'VC' })).toBe('Hello VC');
		locale.value = secondLocale;
		expect(t('vc.sample.message', { name: 'VC' })).toBe('Hi VC');
	});

	it('uses VcInstance locale reactively', async () => {
		VcInstance.configure({ locale: firstLocale });
		const wrapper = mount(defineComponent({
			setup() {
				const { lang, locale, t } = useLocale();
				return () => (
					<div data-lang={lang.value} data-locale={locale.value.name}>
						{t('vc.sample.message', { name: 'VC' })}
					</div>
				);
			}
		}));

		expect(wrapper.attributes('data-lang')).toBe('first');
		expect(wrapper.attributes('data-locale')).toBe('first');
		expect(wrapper.text()).toBe('Hello VC');

		VcInstance.configure({ locale: secondLocale });
		await nextTick();

		expect(wrapper.attributes('data-lang')).toBe('second');
		expect(wrapper.attributes('data-locale')).toBe('second');
		expect(wrapper.text()).toBe('Hi VC');
	});
});
