// @vitest-environment jsdom

import { Measuring, MMeasuring, useMeasuring } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

describe('index.ts', () => {
	const Probe = defineComponent({
		props: { name: String },
		setup(props) {
			const measuring = useMeasuring();
			return () => <span class={props.name} data-measuring={String(measuring)} />;
		}
	});

	it('basic', () => {
		expect(typeof Measuring).toBe('object');
		expect(MMeasuring).toBe(Measuring);
		expect(typeof useMeasuring).toBe('function');
	});

	it('renders the default slot without a wrapper element', () => {
		const wrapper = mount(() => (
			<Measuring>
				<span />
				<i />
			</Measuring>
		));
		expect(wrapper.html().replace(/\s+/g, '')).toBe('<span></span><i></i>');
	});

	it('renders nothing without a slot', () => {
		const wrapper = mount(() => (<Measuring />));
		expect(wrapper.html()).toBe('');
	});

	it('useMeasuring is false outside a measuring scope', () => {
		const wrapper = mount(() => (<Probe name="plain" />));
		expect(wrapper.find('.plain').attributes('data-measuring')).toBe('false');
	});

	it('useMeasuring is true for every descendant, and only for them', () => {
		const Middle = defineComponent(() => () => (<div><Probe name="nested" /></div>));
		const wrapper = mount(() => (
			<div>
				<Measuring>
					<Probe name="direct" />
					<Middle />
				</Measuring>
				<Probe name="sibling" />
			</div>
		));

		expect(wrapper.find('.direct').attributes('data-measuring')).toBe('true');
		expect(wrapper.find('.nested').attributes('data-measuring')).toBe('true');
		expect(wrapper.find('.sibling').attributes('data-measuring')).toBe('false');
	});
});
