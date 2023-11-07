// @vitest-environment jsdom

import { defineComponent, ref } from 'vue';
import { Portal, PortalView } from '@deot/vc-components';
import { Utils } from '@deot/dev-test';
import { mount } from '@vue/test-utils';
import { PortalLeaf } from '../portal-leaf';

describe('index.ts', () => {
	afterEach(() => Portal.clear(true));

	const Wrapper = defineComponent({
		emits: ['portal-fulfilled', 'portal-rejected'],
		props: {
			title: String
		},
		setup(props, { emit, expose }) {
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

			const count = ref(0);
			const isVisible = ref(true);
			const Update = () => {
				return (
					<h2>{ count.value }</h2>
				);
			};

			expose({
				isVisible,
				update: () => {
					count.value++;
				}
			});
			return () => {
				return isVisible.value && (
					<div>
						<Update />
						<Title />
						<button class="ok" onClick={handleOk}>确定</button>
						<button class="cancel" onClick={handleCancel}>取消</button>
					</div>
				);
			};
		} 
	});

	const uid = 'vc-wrapper';
	const root = mount(() => <div class="root" />);
	const Modal = new Portal(Wrapper, {
		el: root.vm.$el,
		leaveDelay: 0,

		globalProperties: {
			anyGlobal: {}
		},
		components: {
			AnyComponent: () => null
		},
		uses: {
			AnyUse: () => {}
		}
	});

	it('basic', () => {
		expect(typeof Portal).toBe('function');
		expect(typeof PortalView).toBe('object');
	});
	it('PortalView', async () => {
		const wrapper = mount(() => (<PortalView />));
		expect(wrapper.html()).toMatch('vc-portal-view');
	});

	it('props', async () => {
		expect(typeof Modal).toBe('object');

		const title = "any";
		const leaf = Modal.popup({ title }, {});

		expect(leaf instanceof PortalLeaf).toBeTruthy();
		expect(root.html()).toMatch(`<h1>${title}</h1>`);
	});

	it('then', async () => {
		expect.assertions(4);
		const leaf = Modal.popup({
			onFulfilled: (e) => {
				expect(e.status).toBe(1);
			}
		});

		leaf.then((e) => {
			expect(e.status).toBe(1);
		});
		expect(Portal.leafs.size).toBe(1);

		root.find('.ok').trigger('click');
		await leaf.target;
		expect(Portal.leafs.size).toBe(0);
	});

	it('then, leaveDelay', async () => {
		expect.assertions(3);
		const leaf = Modal.popup({
			leaveDelay: 10
		});

		leaf.then((e) => {
			expect(e.status).toBe(1);
		});
		root.find('.ok').trigger('click');

		expect(Portal.leafs.size).toBe(1);
		await Utils.sleep(30);
		expect(Portal.leafs.size).toBe(0);
	});

	it('catch', async () => {
		expect.assertions(4);
		const leaf = Modal.popup({
			onRejected: (e) => {
				expect(e.status).toBe(0);
			}
		});

		leaf.catch((e) => {
			expect(e.status).toBe(0);
		});

		expect(Portal.leafs.size).toBe(1);
		root.find('.cancel').trigger('click');

		try {
			await leaf.target;
		} catch {
			expect(Portal.leafs.size).toBe(0);
		}
	});

	it('finally', async () => {
		expect.assertions(3);
		const leaf = Modal.popup();

		leaf.finally(() => {
			expect(1).toBe(1);
		});

		expect(Portal.leafs.size).toBe(1);
		root.find('.ok').trigger('click');

		try {
			await leaf.target;
		} finally {
			expect(Portal.leafs.size).toBe(0);
		}
	});

	it('destroy, any', async () => {
		Modal.popup();
		expect(Portal.leafs.size).toBe(1);
		Modal.destroy();
		expect(Portal.leafs.size).toBe(0);
	});

	it('destroy, multiple', async () => {
		const ModalMultiple = new Portal(Wrapper, {
			el: root.vm.$el,
			leaveDelay: 0,
			multiple: true,
			name: uid
		});

		Modal.popup();
		ModalMultiple.popup();
		ModalMultiple.popup();
		expect(Portal.leafs.size).toBe(3);
		ModalMultiple.destroy();
		expect(Portal.leafs.size).toBe(1);

		Modal.destroy();
		expect(Portal.leafs.size).toBe(0);
	});

	it('destroy, leaf', async () => {
		const leaf = Modal.popup();
		expect(Portal.leafs.size).toBe(1);
		Modal.destroy(leaf);
		Modal.destroy(leaf);
		expect(Portal.leafs.size).toBe(0);
	});

	it('destroy, string', async () => {
		Modal.popup({ name: uid, el: '' });
		expect(Portal.leafs.size).toBe(1);
		Modal.destroy('xxxxx');
		expect(Portal.leafs.size).toBe(1);
		Modal.destroy(uid);
		expect(Portal.leafs.size).toBe(0);
	});

	it('static, clear', async () => {
		Modal.popup({ name: uid });
		expect(Portal.leafs.size).toBe(1);
		Portal.clear();
		expect(Portal.leafs.size).toBe(0);
	});

	it('static, clear, autoDestroy = false', async () => {
		Modal.popup({ name: uid, autoDestroy: false });
		expect(Portal.leafs.size).toBe(1);
		Portal.clear();
		expect(Portal.leafs.size).toBe(1);
		Portal.clear(true);
		expect(Portal.leafs.size).toBe(0);
	});

	it('static, clear, string', async () => {
		Modal.popup({ name: uid });
		expect(Portal.leafs.size).toBe(1);
		Portal.clear(uid);
		expect(Portal.leafs.size).toBe(0);
	});

	it('static, clear, string[]', async () => {
		Modal.popup({ name: uid });
		expect(Portal.leafs.size).toBe(1);
		Portal.clear([]);
		Portal.clear([uid]);
		expect(Portal.leafs.size).toBe(0);
	});

	it('static, clearAll', async () => {
		Modal.popup({ name: uid });
		expect(Portal.leafs.size).toBe(1);
		Portal.clearAll();
		expect(Portal.leafs.size).toBe(0);
	});

	it('static, fragment', async () => {
		Modal.popup({ name: uid, fragment: true });
		expect(root.html()).toMatch(`data-v-app`);
	});

	it('alive', async () => {
		const ModalAlive = new Portal(Wrapper, {
			el: root.vm.$el,
			leaveDelay: 0,
			alive: true,
			name: uid
		});

		ModalAlive.popup({ title: '123' });
		expect(root.html()).toMatch(`<h1>123</h1>`);
		expect(root.html()).toMatch(`<h2>0</h2>`);
		expect(Portal.leafs.size).toBe(1);

		ModalAlive.popup({ title: '456' });
		await Utils.sleep(1);
		expect(root.html()).toMatch(`<h1>456</h1>`);
		expect(root.html()).toMatch(`<h2>1</h2>`);
		expect(Portal.leafs.size).toBe(1);

		ModalAlive.popup({ title: '789' });
		await Utils.sleep(1);
		expect(root.html()).toMatch(`<h1>789</h1>`);
		expect(root.html()).toMatch(`<h2>2</h2>`);
		expect(Portal.leafs.size).toBe(1);

		document.dispatchEvent(new Event('click'));
		await Utils.sleep(1);
		expect(Portal.leafs.size).toBe(0);
	});
});
