// @vitest-environment jsdom

import { defineComponent } from 'vue';
import { Portal, PortalView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	const Wrapper = defineComponent({
		name: 'vc-wrapper',
		emits: ['portal-fulfilled', 'portal-rejected'],
		props: {
			title: String
		},
		setup(props, { emit }) {
			const handleOk = () => {
				emit('portal-fulfilled', { status: 1, title: props.title });
			};

			const handleCancel = () => {
				emit('portal-rejected', { status: 0, title: props.title });
			};

			const Title = () => {
				return (
					<h1>{ props.title }</h1>
				);
			};
			return () => {
				return (
					<div>
						<Title />
						<div onClick={handleOk}>确定</div>
						<div onClick={handleCancel}>取消</div>
					</div>
				);
			};
		} 
	});
	const root = mount(() => <div class="root" />);
	const Modal = new Portal(Wrapper, {
		el: root.vm.$el
	});

	it('basic', () => {
		expect(typeof Portal).toBe('function');
		expect(typeof PortalView).toBe('object');
	});
	it('create, PortalView', async () => {
		const wrapper = mount(() => (<PortalView />));
		expect(wrapper.html()).toMatch('vc-portal-view');
	});

	it('create, props', async () => {
		expect(typeof Modal).toBe('object');

		const title = "any";
		Modal.popup({
			title,
			promise: false
		});

		expect(root.html()).toMatch(`<h1>${title}</h1>`);
	});
});
