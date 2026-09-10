// @vitest-environment jsdom

import { defineComponent, h, inject, nextTick, provide, ref } from 'vue';
import { Portal, PortalView } from '@deot/vc-components';
import { Utils } from '@deot/dev-test';
import { mount } from '@vue/test-utils';
import { PortalLeaf } from '../portal-leaf';

describe('index.ts', () => {
	afterEach(() => Portal.clear(true));

	const Wrapper = defineComponent({
		emits: ['portal-fulfilled', 'portal-rejected', 'portal-destroyed'],
		props: {
			title: String
		},
		setup(props, { emit, expose }) {
			const handleClose = () => {
				emit('portal-destroyed');
			};

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
						<button class="close" onClick={handleClose}>关闭</button>
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

		const title = 'any';
		const leaf = Modal.popup({ title }, {});

		expect(leaf instanceof PortalLeaf).toBeTruthy();
		expect(root.html()).toMatch(`<h1>${title}</h1>`);
	});

	it('onBeforeCreate, async', async () => {
		const title = 'any';
		Modal.popup({
			onBeforeCreate: () => {
				return Promise.resolve({
					title
				});
			}
		});

		await Utils.sleep(1);
		expect(root.html()).toMatch(`<h1>${title}</h1>`);
	});

	it('onBeforeCreate, pending destroy', async () => {
		const title1 = 'any1';
		const title2 = 'any2';
		Modal.popup({
			onBeforeCreate: () => {
				return Promise.resolve({
					title: title1
				});
			}
		});

		Modal.popup({
			onBeforeCreate: () => {
				return Promise.resolve({
					title: title2
				});
			}
		});

		expect(Portal.leafs.size).toBe(1);
		await Utils.sleep(1);
		expect(root.html()).toMatch(`<h1>${title2}</h1>`);
	});

	it('onBeforeCreate, sync', async () => {
		const title = 'any';
		Modal.popup({
			onBeforeCreate: () => {
				return {
					title
				};
			}
		});

		expect(root.html()).toMatch(`<h1>${title}</h1>`);
	});

	it('onBeforeCreate, error', async () => {
		Modal.popup({
			onBeforeCreate: () => {
				return Promise.reject(new Error('xxx'));
			}
		});

		expect(Portal.leafs.size).toBe(1);
		await Utils.sleep(1);
		expect(Portal.leafs.size).toBe(0);
	});

	it('then', async () => {
		expect.assertions(5);
		const leaf = Modal.popup({
			onFulfilled: (e) => {
				expect(e.status).toBe(1);
			},
			onDestroyed: () => {
				expect(1).toBe(1);
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
		expect.assertions(5);
		const leaf = Modal.popup({
			onRejected: (e) => {
				expect(e.status).toBe(0);
			},
			onDestroyed: () => {
				expect(1).toBe(1);
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

	it('destroy, event/close', async () => {
		expect.assertions(3);
		const leaf = Modal.popup({
			onDestroyed: () => {
				expect(1).toBe(1);
			}
		});

		leaf.finally(() => {
			expect(1).toBe(2); // 不会执行
		});

		expect(Portal.leafs.size).toBe(1);
		root.find('.close').trigger('click');
		expect(Portal.leafs.size).toBe(0);
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

		ModalAlive.popup({ title: '789', leaveDelay: 10 });
		expect(Portal.leafs.size).toBe(1);
		document.dispatchEvent(new Event('click'));
		expect(Portal.leafs.size).toBe(1);

		await Utils.sleep(20);
		expect(Portal.leafs.size).toBe(0);
	});

	it('explicit propsData separates reserved configuration names from wrapper props', () => {
		const NamedWrapper = defineComponent({
			props: { name: String, title: String },
			setup: props => () => (
				<p>
					{ props.name }
					/
					{ props.title }
				</p>
			)
		});
		const viewer = new Portal(NamedWrapper, { el: root.vm.$el, leaveDelay: 0 });
		viewer.popup({
			name: 'service-name',
			title: 'not a prop',
			propsData: { name: 'record-name', title: 'record-title' }
		});
		expect(root.text()).toBe('record-name/record-title');
		expect(Portal.leafs.has('service-name')).toBe(true);

		viewer.popup({ name: 'another-record', title: 'another-title' }, { name: 'service-name' });
		expect(root.text()).toBe('another-record/another-title');
		expect(Portal.leafs.size).toBe(1);
	});

	it('onBeforeCreate result overrides original props without changing the base props ref', async () => {
		const leaf = Modal.popup({
			propsData: { title: 'original' },
			onBeforeCreate: props => Promise.resolve({ title: props!.title + '-loaded' })
		});
		expect(root.find('h1').exists()).toBe(false);
		await Utils.sleep(1);
		expect(root.find('h1').text()).toBe('original-loaded');
		expect(leaf.propsData!.value.title).toBe('original');
	});

	it('failed preparation reports destruction but does not reject the result', async () => {
		const error = new Error('load failed');
		const destroyed = vi.fn();
		const settled = vi.fn();
		const leaf = Modal.popup({
			onBeforeCreate: () => Promise.reject(error),
			onDestroyed: destroyed
		});
		leaf.then(settled, settled);
		await Utils.sleep(1);
		expect(destroyed).toHaveBeenCalledWith(error);
		expect(settled).not.toHaveBeenCalled();
		expect(Portal.leafs.size).toBe(0);
		expect(root.find('h1').exists()).toBe(false);
	});

	it('result settlement precedes delayed cleanup even when autoDestroy is false', async () => {
		vi.useFakeTimers();
		try {
			const destroyed = vi.fn();
			const leaf = Modal.popup({ leaveDelay: 300, autoDestroy: false, onDestroyed: destroyed });
			leaf.resolve({ id: 1 });
			await expect(leaf.target).resolves.toEqual({ id: 1 });
			expect(destroyed).not.toHaveBeenCalled();
			vi.advanceTimersByTime(299);
			expect(Portal.leafs.size).toBe(1);
			vi.advanceTimersByTime(1);
			expect(destroyed).toHaveBeenCalledTimes(1);
			expect(Portal.leafs.size).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});

	it('same-name replacement and direct destroy leave pending results unsettled', async () => {
		const settled = vi.fn();
		const first = Modal.popup({ title: 'first' });
		first.then(settled, settled);
		const second = Modal.popup({ title: 'second' });
		second.then(settled, settled);
		expect(root.find('h1').text()).toBe('second');
		second.destroy();
		await Promise.resolve();
		expect(settled).not.toHaveBeenCalled();
		expect(Portal.leafs.size).toBe(0);
	});

	it('multiple panels preserve insertion order and can be rejected independently', async () => {
		const viewer = new Portal(Wrapper, {
			el: root.vm.$el,
			name: 'panel-group',
			multiple: true,
			fragment: true,
			insertion: 'first',
			leaveDelay: 0
		});
		const first = viewer.popup({ title: 'first' });
		const second = viewer.popup({ title: 'second' });
		expect(root.findAll('h1').map(item => item.text())).toEqual(['second', 'first']);
		const rejected = second.catch(reason => reason);
		second.reject('cancel second');
		expect(await rejected).toBe('cancel second');
		expect(root.findAll('h1').map(item => item.text())).toEqual(['first']);
		viewer.destroy(first);
		expect(root.findAll('h1')).toHaveLength(0);
	});

	it('fragment preserves conditional roots across updates and cleans every node', async () => {
		const visible = ref(false);
		const FragmentWrapper = defineComponent({
			setup: () => () => [
				visible.value && <p>conditional root</p>,
				<span>stable root</span>
			]
		});
		const viewer = new Portal(FragmentWrapper, { el: root.vm.$el, fragment: true });
		const leaf = viewer.popup();
		expect(root.text()).toBe('stable root');
		visible.value = true;
		await nextTick();
		expect(root.text()).toBe('conditional rootstable root');
		leaf.destroy();
		expect(root.text()).toBe('');
	});

	it('install injects reactive dependencies and slots stay reactive', async () => {
		const workspace = ref('A');
		const InjectedWrapper = defineComponent({
			setup(_, { slots }) {
				const value = inject('workspace');
				return () => (
					<section>
						<p>{ (value as typeof workspace).value }</p>
						{ slots.default?.() }
					</section>
				);
			}
		});
		const viewer = new Portal(InjectedWrapper, {
			el: root.vm.$el,
			install: app => app.provide('workspace', workspace)
		});
		const leaf = viewer.popup({ slots: { default: () => h('span', workspace.value) } });
		expect(root.text()).toBe('AA');
		workspace.value = 'B';
		await nextTick();
		expect(root.text()).toBe('BB');
		leaf.destroy();
		expect(root.text()).toBe('');
	});

	it('alive updates exposed state after props and protects matching external triggers', async () => {
		const viewer = new Portal(Wrapper, {
			el: root.vm.$el,
			alive: true,
			fragment: true,
			leaveDelay: 0
		});
		const trigger = document.createElement('button');
		trigger.className = 'vc-portal-alive';
		document.body.appendChild(trigger);
		try {
			const first = viewer.popup({ title: 'A' });
			trigger.click();
			const second = viewer.popup({ title: 'B' });
			expect(second).toBe(first);
			await nextTick();
			await nextTick();
			expect(root.find('h1').text()).toBe('B');
			expect(root.find('h2').text()).toBe('1');
			document.body.click();
			expect(Portal.leafs.size).toBe(0);
			viewer.popup({ title: 'C' });
			expect(root.find('h2').text()).toBe('0');
		} finally {
			trigger.remove();
		}
	});

	it('PortalView keeps the default slot local and teleports reactive content with injection', async () => {
		const count = ref(0);
		const Content = defineComponent({
			setup() {
				const label = inject('label');
				return () => (
					<button class="portal-view-content" onClick={() => count.value++}>
						{ label }
						:
						{ count.value }
					</button>
				);
			}
		});
		const wrapper = mount(defineComponent({
			setup() {
				provide('label', 'provided');
				return () => (
					<PortalView tag="section">
						{ {
							default: () => <p>placeholder</p>,
							content: () => <Content />
						} }
					</PortalView>
				);
			}
		}));
		try {
			expect(wrapper.find('section.vc-portal-view').text()).toBe('placeholder');
			expect(wrapper.find('.portal-view-content').exists()).toBe(false);
			const button = document.body.querySelector<HTMLButtonElement>('.portal-view-content')!;
			expect(button.textContent).toBe('provided:0');
			button.click();
			await nextTick();
			expect(button.textContent).toBe('provided:1');
		} finally {
			wrapper.unmount();
		}
		expect(document.body.querySelector('.portal-view-content')).toBeNull();
	});
});
