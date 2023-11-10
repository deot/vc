// @vitest-environment jsdom

import { ref, withDirectives, vShow } from 'vue';
import { TransitionFade } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

describe('transition-fade.ts', () => {
	it('create', async () => {
		const isVisible = ref(false);
		const isGroup = ref(false);
		const mode = ref('none');
		
		const wrapper = mount(
			() => (
				<TransitionFade 
					origin="0"
					mode={mode.value}
					group={isGroup.value}
					duration={10} 
				>
					{ withDirectives(<div key="1" />, [[vShow, isVisible.value]])}
				</TransitionFade>
			)
		);
		let vm = wrapper.getComponent({ name: 'transition' });
		expect(vm.props('enterActiveClass')).toBe('vc-transition-fade is-in');
		expect(vm.props('leaveActiveClass')).toBe('vc-transition-fade is-out');

		isGroup.value = true;
		await Utils.sleep(1);
		vm = wrapper.getComponent({ name: 'transition-group' });
		expect(vm.props('moveClass')).toBe('vc-transition-fade is-move');
	});
});
