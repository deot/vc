// @vitest-environment jsdom

import { ref, createApp } from 'vue';
import { Transition as VTransition } from '@deot/vc-components';
// import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

describe('transition.ts', () => {
	const root = document.createElement('div');
	document.body.appendChild(root);

	it('create', async () => {
		const isVisible = ref(false);
		const isGroup = ref(false);
		const mode = ref('none');
		const methods = {
			onBeforeEnter: vi.fn(),
			onEnter: vi.fn((_: any, next: any) => {
				next();
			}),
			onAfterEnter: vi.fn(),
			onBeforeLeave: vi.fn(),
			onLeave: vi.fn(),
			onAfterLeave: vi.fn()
		};
		const app = createApp(
			() => (
				<VTransition
					origin="0"
					mode={mode.value}
					group={isGroup.value}
					duration={1}
					{
						...methods
					}
				>
					<div v-show={isVisible.value} key="1" />
				</VTransition>
			)
		);

		app.mount(root);

		isVisible.value = true;
		await Utils.sleep(10);
		const el = root.querySelector('div')!;
		expect(el.classList.contains('v-enter-from')).toBeTruthy();
		await Utils.sleep(50);
		expect(el.classList.contains('v-enter-to')).toBeTruthy();

		isGroup.value = true;
		await Utils.sleep(30);
		expect(root.innerHTML).toBe(`<div></div>`);

		isVisible.value = false;
		await Utils.sleep(50);
		expect(methods.onBeforeEnter).toHaveBeenCalledTimes(1);
		expect(methods.onAfterEnter).toHaveBeenCalledTimes(1);
		expect(methods.onBeforeLeave).toHaveBeenCalledTimes(1);
		expect(methods.onAfterLeave).toHaveBeenCalledTimes(1);
		expect(methods.onEnter).toHaveBeenCalledTimes(1);
		expect(methods.onLeave).toHaveBeenCalledTimes(1);

		mode.value = 'left-part';
		await Utils.sleep(30);
	});
});
