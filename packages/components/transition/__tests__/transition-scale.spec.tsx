// @vitest-environment jsdom

import { ref } from 'vue';
import { TransitionScale } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

describe('transition-scale.ts', () => {
	it('create', async () => {
		const isVisible = ref(false);
		const isGroup = ref(false);
		const mode = ref('x');

		const wrapper = mount(
			() => (
				<TransitionScale
					origin="0"
					mode={mode.value}
					group={isGroup.value}
					duration={1}
				>
					<div v-show={isVisible.value} key="1" />
				</TransitionScale>
			)
		);
		let vm = wrapper.getComponent({ name: 'transition' });
		expect(vm.props('enterActiveClass')).toBe('vc-transition-scale is-x is-in');
		expect(vm.props('leaveActiveClass')).toBe('vc-transition-scale is-x is-out');

		isGroup.value = true;
		await Utils.sleep(1);
		vm = wrapper.getComponent({ name: 'transition-group' });
		expect(vm.props('moveClass')).toBe('vc-transition-scale is-x is-move');
	});
});
