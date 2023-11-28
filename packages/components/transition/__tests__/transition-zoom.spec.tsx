// @vitest-environment jsdom

import { ref } from 'vue';
import { TransitionZoom } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

describe('transition-zoom.ts', () => {
	it('create', async () => {
		const isVisible = ref(false);
		const isGroup = ref(false);
		const mode = ref('none');
		
		const wrapper = mount(
			() => (
				<TransitionZoom 
					origin="0"
					mode={mode.value}
					group={isGroup.value}
					duration={1} 
				>
					<div v-show={isVisible.value} key="1" />
				</TransitionZoom>
			)
		);
		let vm = wrapper.getComponent({ name: 'transition' });
		expect(vm.props('enterActiveClass')).toBe('vc-transition-zoom is-in');
		expect(vm.props('leaveActiveClass')).toBe('vc-transition-zoom is-out');

		isGroup.value = true;
		await Utils.sleep(1);
		vm = wrapper.getComponent({ name: 'transition-group' });
		expect(vm.props('moveClass')).toBe('vc-transition-zoom is-move');
	});
});
