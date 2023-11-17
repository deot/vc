// @vitest-environment jsdom

import { ref, withDirectives, vShow } from 'vue';
import { TransitionSlide } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

describe('transition-slide.ts', () => {
	it('create', async () => {
		const isVisible = ref(false);
		const isGroup = ref(false);
		const mode = ref('left-part');
		
		const wrapper = mount(
			() => (
				<TransitionSlide 
					origin="0"
					mode={mode.value}
					group={isGroup.value}
					duration={1} 
				>
					{ withDirectives(<div key="1" />, [[vShow, isVisible.value]])}
				</TransitionSlide>
			)
		);
		let vm = wrapper.getComponent({ name: 'transition' });
		expect(vm.props('enterActiveClass')).toBe('vc-transition-slide is-left is-part is-in');
		expect(vm.props('leaveActiveClass')).toBe('vc-transition-slide is-left is-part is-out');

		isGroup.value = true;
		await Utils.sleep(1);
		vm = wrapper.getComponent({ name: 'transition-group' });
		expect(vm.props('moveClass')).toBe('vc-transition-slide is-left is-part is-move');
	});
});
