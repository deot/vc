// @vitest-environment jsdom
import {
	defineComponent, h, nextTick, ref
} from 'vue';
import { mount } from '@vue/test-utils';
import { PARAMETERS, useAuditTheme } from '../examples/theme-audit/use-audit-theme';
import { STORAGE_KEY } from '../examples/theme-audit/model';
import TabsDemo from '../examples/theme-audit/modules/tabs.vue';
import { MTabs } from '../../tabs/index.m';
import { MODULES } from '../examples/theme-audit/modules';
import GallerySamples from '../examples/theme-audit/gallery.vue';
import { MOBILE_ONLY } from '../examples/theme-audit/catalogue';
import { Chart } from '../../chart';
import { Button } from '../../button';
import { Input } from '../../input';
import { Upload } from '../../upload';
import { Countdown } from '../../countdown';
import { Portal } from '../../portal';
import { ColorPicker } from '../../color-picker';
import { RadioGroup } from '../../radio';
import { Editor } from '../../editor';
import { ImageCrop } from '../../image-crop';
import { Snapshot } from '../../snapshot';
import { Scroller } from '../../scroller';
import { Clipboard } from '../../clipboard';
import { Message } from '../../message';
import ThemeAudit from '../examples/theme-audit.vue';
import AuditGrid from '../examples/theme-audit/audit-grid.vue';

vi.mock('../examples/theme-audit/parameters.module.scss',
	() => ({
		default: {
			'color-neutral-light__mode': 'paired',
			'color-neutral-light__kind': 'color',
			'color-neutral-light__light': '#EDEFF1',
			'color-neutral-light__dark': '#3B4354',
			'color-primary__mode': 'shared',
			'color-primary__kind': 'color',
			'color-primary__light': '#456CF6',
			'color-primary__dark': '#456CF6',
			'background-color-lightest__mode': 'paired',
			'background-color-lightest__kind': 'color',
			'background-color-lightest__light': '#fff',
			'background-color-lightest__dark': '#252B3A'
		}
	}));

describe('Theme audit demo: independent modules',
	() => {
		it('resolves each of the 73 modules through the gallery',
			() => {
				expect(Object.keys(MODULES)).toHaveLength(73);
				for (const [name, component] of Object.entries(MODULES)) {
					const wrapper = mount(GallerySamples, { props: { name }, shallow: true });
					try { expect(wrapper.findComponent(component).exists(), name).toBe(true); } finally { wrapper.unmount(); }
				}
			});
		it('preserves desktop and mobile platform filtering',
			() => {
				const wrapper = mount(GallerySamples, { props: { name: 'Input', platform: 'all' }, shallow: true });
				try {
					expect(wrapper.findAllComponents(MODULES.Input)).toHaveLength(2);
				} finally { wrapper.unmount(); }
				for (const name of MOBILE_ONLY) {
					const mobile = mount(GallerySamples, { props: { name, platform: 'mobile' }, shallow: true });
					try {
						expect((mobile.findComponent(MODULES[name]).props() as Record<string, unknown>).mobile).toBe(true);
					} finally { mobile.unmount(); }
				}
			});
		it('labels independent mobile versions without duplicating generic component labels', () => {
			const common = mount(GallerySamples, { props: { name: 'Tag' }, shallow: true });
			const mobile = mount(GallerySamples, { props: { name: 'Input' }, shallow: true });
			try {
				expect(common.find('.audit-version__label').exists()).toBe(false);
				expect(mobile.findAll('.audit-version__label').map(label => label.text())).toEqual(['桌面端', '移动端 · 独立实现']);
			} finally { common.unmount(); mobile.unmount(); }
		});
		it('preserves input ordinary, disabled, readonly and composed states',
			() => {
				const wrapper = mount(MODULES.Input, { shallow: true });
				try {
					const inputs = wrapper.findAllComponents(Input);
					expect(inputs).toHaveLength(6);
					expect(inputs.slice(0, 5).map(input => input.props('disabled'))).toEqual([false, false, true, true, false]);
					expect(inputs[4].vm.$attrs.readonly).toBe(true);
				} finally { wrapper.unmount(); }
			});
		it('renders Chart immediately and updates from live theme previews',
			async () => {
				const effectiveMode = ref('light');
				const liveChanges = ref({});
				const originalStyle = document.body.getAttribute('style');
				document.body.style.setProperty('--vc-color-primary', '#123456');
				const wrapper = mount(MODULES.Chart, {
					shallow: true, global: { provide: { 'theme-audit': { effectiveMode, liveChanges } } }
				});
				try {
					expect(wrapper.findComponent(Chart).exists()).toBe(true);
					await nextTick();
					expect(wrapper.findComponent(Chart).props('options')!.color[0]).toBe('#123456');
					document.body.style.setProperty('--vc-color-primary', '#abcdef');
					liveChanges.value = { shared: { 'color-primary': '#abcdef' } };
					await nextTick();
					expect(wrapper.findComponent(Chart).props('options')!.color[0]).toBe('#abcdef');
				} finally {
					wrapper.unmount();
					if (originalStyle === null) document.body.removeAttribute('style');
					else document.body.setAttribute('style', originalStyle);
				}
			});
		it.each([
			['Editor', Editor], ['ImageCrop', ImageCrop], ['Snapshot', Snapshot]
		] as const)('renders %s without an initialization or collapse control', (name, component) => {
			const wrapper = mount(MODULES[name], { shallow: true });
			try {
				expect(wrapper.findComponent(component).exists()).toBe(true);
				expect(wrapper.text()).not.toMatch(/初始化|收起/);
			} finally { wrapper.unmount(); }
		});
		it('starts Countdown only on request and gives its idle completion a readable fallback',
			async () => {
				const wrapper = mount(MODULES.Countdown, { shallow: true, global: { renderStubDefaultSlot: true } });
				try {
					expect(wrapper.findAllComponents(Countdown)).toHaveLength(1);
					expect(wrapper.findComponent(Countdown).props('targetTime')).toBe(0);
					expect(wrapper.text()).toContain('00:00:00 · 已结束');
					await wrapper.findComponent(Button).trigger('click');
					expect(wrapper.findAllComponents(Countdown)).toHaveLength(2);
				} finally { wrapper.unmount(); }
			});
		it('cleans up Portal content when the page closes its overlays',
			async () => {
				const wrapper = mount(MODULES.Portal, { props: { overlayGeneration: 0 } });
				try {
					await wrapper.findComponent(Button).trigger('click');
					expect(wrapper.find('.audit-portal-host').text()).toContain('Portal 挂载后的内容');
					await wrapper.setProps({ overlayGeneration: 1 });
					expect(wrapper.find('.audit-portal-host').text()).toBe('');
				} finally { wrapper.unmount(); }
			});
		it.each([
			['ActionSheet', '.vcm-action-sheet'], ['Modal', '.vc-modal'], ['Drawer', '.vc-drawer'],
			['Popup', '.vcm-popup'], ['Message', '.vc-message'], ['Notice', '.vc-notice'], ['Toast', '.vcm-toast']
		] as const)('opens %s by method without changing its inline content and cleans up owned leaves',
			async (name, selector) => {
				const initial = new Set(Portal.leafs.keys());
				const wrapper = mount(MODULES[name], {
					props: { overlayGeneration: 0 }
				});
				try {
					const inline = wrapper.html();
					await wrapper.findAllComponents(Button)[0].trigger('click');
					await nextTick();
					expect(document.querySelector(selector)).not.toBeNull();
					expect(wrapper.html()).toBe(inline);
					expect(wrapper.find('.vc-portal-view').exists()).toBe(false);
					expect([...Portal.leafs.keys()].filter(key => !initial.has(key))).toHaveLength(1);
					await wrapper.setProps({ overlayGeneration: 1 });
					expect(new Set(Portal.leafs.keys())).toEqual(initial);
					await wrapper.findAllComponents(Button)[0].trigger('click');
				} finally { wrapper.unmount(); }
				expect(new Set(Portal.leafs.keys())).toEqual(initial);
			});
		it('uses the supported mobile Modal methods and destroys only its own instances', async () => {
			const other = new Portal(defineComponent({ setup: () => () => h('div', 'other portal') })).popup();
			const initial = new Set(Portal.leafs.keys());
			const wrapper = mount(MODULES.Modal, { props: { mobile: true } });
			try {
				expect(wrapper.findAllComponents(Button).map(button => button.text())).toEqual(['alert 对话框', 'operation 对话框']);
				await wrapper.findAllComponents(Button)[0].trigger('click');
				expect(document.querySelector('.vcm-modal')).not.toBeNull();
				wrapper.unmount();
				expect(new Set(Portal.leafs.keys())).toEqual(initial);
				expect(other.wrapper).toBeDefined();
			} finally { wrapper.unmount(); other.destroy(); }
		});
		it('preserves Upload request and response callbacks in the template', () => {
			const wrapper = mount(MODULES.Upload, { shallow: true });
			try {
				const { onRequest, onResponse } = wrapper.findComponent(Upload).vm.$.vnode.props!;
				const requestOptions = { url: '/upload', file: { name: 'sample.png' } };
				expect(onRequest({ requestOptions })).toEqual({ ...requestOptions, url: undefined });
				expect(onResponse({ requestOptions })).toEqual({ name: 'sample.png' });
			} finally { wrapper.unmount(); }
		});
		it('opens UploadTask lazily by method and keeps its task controls working', async () => {
			const initial = new Set(Portal.leafs.keys());
			const wrapper = mount(MODULES.Upload);
			try {
				const buttons = wrapper.findAllComponents(Button);
				const inline = wrapper.html();
				await buttons.find(button => button.text() === '展示四种任务状态')!.trigger('click');
				expect(document.querySelectorAll('.vc-upload-task__list li')).toHaveLength(4);
				expect(wrapper.html()).toBe(inline);
				await buttons.find(button => button.text() === '展示合计结果')!.trigger('click');
				expect(document.querySelector('.vc-upload-task__result')?.textContent).toContain('3');
			} finally { wrapper.unmount(); }
			expect(new Set(Portal.leafs.keys())).toEqual(initial);
		});
	});

describe('Theme audit demo: card grid', () => {
	it('recognizes the BEM full-width state without stretching card height', async () => {
		vi.stubGlobal('ResizeObserver', class {
			observe() {}
			unobserve() {}
			disconnect() {}
		});
		const rectangle = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ height: 100 }) as DOMRect);
		const wrapper = mount(AuditGrid, {
			attrs: { style: { 'columnGap': '12px', '--audit-grid-columns': 2 } },
			slots: { default: '<article class="audit-card is-wide"></article><article class="audit-card"></article>' }
		});
		try {
			await nextTick();
			const wide = wrapper.find('.is-wide').element as HTMLElement;
			expect(wide.style.gridColumnEnd).toBe('span 2');
			expect(wide.style.alignSelf).toBe('start');
		} finally { wrapper.unmount(); rectangle.mockRestore(); vi.unstubAllGlobals(); }
	});
	it('keeps column assignments during resizing and resets them for responsive columns or new cards', async () => {
		let resize = () => {};
		vi.stubGlobal('ResizeObserver', class {
			constructor(callback: () => void) { resize = callback; }
			observe() {}
			unobserve() {}
			disconnect() {}
		});
		const heights = [80, 150, 230, 270, 120];
		const rectangle = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			return { height: heights[Number(this.dataset.index)] || 0 } as DOMRect;
		});
		const columns = ref(2);
		const count = ref(4);
		const wrapper = mount(defineComponent({
			setup: () => () => h(AuditGrid, { style: { 'columnGap': '12px', '--audit-grid-columns': columns.value } },
				() => Array.from({ length: count.value }, (_, key) => h('article', { key, 'data-index': key })))
		}), { attachTo: document.body });
		const placements = () => wrapper.findAll('article').map(card => (card.element as HTMLElement).style.gridColumnStart);
		try {
			await nextTick();
			const initial = placements();
			expect(new Set(initial)).toEqual(new Set(['1', '2']));
			for (const height of [20, 600, 150]) {
				heights[1] = height;
				resize();
				expect(placements()).toEqual(initial);
			}
			columns.value = 1;
			await nextTick();
			resize();
			expect(placements()).toEqual(['1', '1', '1', '1']);
			columns.value = 2;
			await nextTick();
			resize();
			expect(placements()).toEqual(initial);
			count.value = 5;
			await nextTick();
			expect(placements()).toHaveLength(5);
			expect(new Set(placements())).toEqual(new Set(['1', '2']));
		} finally { wrapper.unmount(); rectangle.mockRestore(); vi.unstubAllGlobals(); }
	});
	it('updates content spans, observes new cards and disconnects on unmount', async () => {
		let resize = () => {};
		const observe = vi.fn();
		const unobserve = vi.fn();
		const disconnect = vi.fn();
		vi.stubGlobal('ResizeObserver', class {
			constructor(callback: () => void) { resize = callback; }
			observe = observe;
			unobserve = unobserve;
			disconnect = disconnect;
		});
		let height = 100;
		const rectangle = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ height }) as DOMRect);
		const count = ref(1);
		const wrapper = mount(defineComponent({
			setup: () => () => h(AuditGrid, { style: { columnGap: '12px' } },
				() => Array.from({ length: count.value }, (_, key) => h('article', { key })))
		}));
		try {
			await nextTick();
			expect(wrapper.find('.audit-cards').attributes('style')).toContain('grid-template-rows: 112px');
			height = 220;
			resize();
			expect(wrapper.find('.audit-cards').attributes('style')).toContain('grid-template-rows: 232px');
			count.value = 2;
			await nextTick();
			expect(wrapper.findAll('article')).toHaveLength(2);
			expect(observe).toHaveBeenCalledTimes(3);
			count.value = 1;
			await nextTick();
			expect(unobserve).toHaveBeenCalledTimes(1);
		} finally { wrapper.unmount(); rectangle.mockRestore(); vi.unstubAllGlobals(); }
		expect(disconnect).toHaveBeenCalledOnce();
	});
});

describe('Theme audit demo: mobile tabs',
	() => {
		it('keeps ordinary and step tabs inline without the black-gold theme',
			() => {
				const wrapper = mount(TabsDemo,
					{ props: { mobile: true }, shallow: true });
				try {
					const tabs = wrapper.findAllComponents(MTabs);
					expect(tabs).toHaveLength(2);
					expect(wrapper.text()).not.toContain('黑金');
					expect(tabs.map(tab => tab.props('showStep'))).toEqual([false, true]);
					for (const tab of tabs) {
						expect(tab.props('theme')).toBe('light');
						expect(tab.props('barStyle')).toEqual({ position: 'relative', top: 'auto' });
					}
				} finally {
					wrapper.unmount();
				}
			});
	});

describe('Theme audit demo: runtime',
	() => {
		let audit: ReturnType<typeof useAuditTheme>;
		let wrapper: ReturnType<typeof mount>;
		let media: {
			matches: boolean;
			addEventListener: ReturnType<typeof vi.fn>;
			removeEventListener: ReturnType<typeof vi.fn>;
		};
		let originalMode: string | null;
		const primary = PARAMETERS.find(parameter => parameter.name === 'color-primary')!;
		const surface = PARAMETERS.find(parameter => parameter.name === 'background-color-lightest')!;
		const start = () => {
			wrapper = mount(defineComponent({ setup() { audit = useAuditTheme(); return () => h('div'); } }));
		};
		beforeEach(() => {
			originalMode = document.body.getAttribute('data-vc-theme');
			localStorage.removeItem(STORAGE_KEY);
			media = {
				matches: false,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn()
			};
			vi.stubGlobal('matchMedia',
				vi.fn(() => media));
			vi.stubGlobal('CSS',
				{ supports: (_property: string, value: string) => value !== 'invalid' });
		});
		afterEach(() => {
			wrapper?.unmount();
			localStorage.removeItem(STORAGE_KEY);
			if (originalMode === null) document.body.removeAttribute('data-vc-theme');
			else document.body.setAttribute('data-vc-theme',
				originalMode);
			vi.restoreAllMocks();
			vi.unstubAllGlobals();
		});
		it('starts a separate cache version without applying or rewriting old grade overrides', async () => {
			const previousKey = 'vc:theme-audit:v1';
			const previous = JSON.stringify({
				mode: 'dark',
				changes: { shared: { 'color-primary': '#123456' }, light: { 'background-color-light': '#ff0000' } }
			});
			localStorage.setItem(previousKey, previous);
			try {
				start();
				await nextTick();
				expect(STORAGE_KEY).toBe('vc:theme-audit:v2');
				expect(audit.mode.value).toBe('light');
				expect(audit.value(primary)).toBe('#456CF6');
				expect(audit.value(surface, 'light')).toBe('#fff');
				expect(audit.changedCount.value).toBe(0);
				audit.handleCommit(surface, '#abcdef', 'light');
				await nextTick();
				expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).changes.light).toEqual({ 'background-color-lightest': '#abcdef' });
				expect(localStorage.getItem(previousKey)).toBe(previous);
			} finally {
				localStorage.removeItem(previousKey);
			}
		});
		it('previews without saving, cancels, then commits and persists',
			async () => {
				start();
				audit.handlePreview(primary,
					'#123456');
				await nextTick();
				expect(document.querySelector('style[data-theme-audit]')!.textContent).toContain('#123456');
				expect(audit.value(primary)).toBe('#456CF6');
				expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
				audit.handleCancelPreview(primary);
				await nextTick();
				expect(document.querySelector('style[data-theme-audit]')!.textContent).not.toContain('#123456');
				expect(audit.handleCommit(primary,
					'#abcdef')).toBe(true);
				await nextTick();
				expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).changes.shared['color-primary']).toBe('#abcdef');
			});
		it('keeps paired values independent and rejects invalid commits',
			async () => {
				start();
				audit.mode.value = 'dark';
				await nextTick();
				expect(document.body.getAttribute('data-vc-theme')).toBe('dark');
				audit.handleCommit(surface,
					'#334455');
				expect(audit.value(surface, 'light')).toBe('#fff');
				expect(audit.handleCommit(surface,
					'invalid', 'light')).toBe(false);
				expect(audit.errors[audit.errorKey(surface, 'light')]).toBeTruthy();
				audit.handleReset();
				expect(audit.changedCount.value).toBe(0);
				expect(audit.errors).toEqual({});
			});
		it('allows simultaneous light and dark edits, previews and independent cancellation',
			async () => {
				start();
				audit.handleCommit(surface, '#111111', 'light');
				audit.handleCommit(surface, '#222222', 'dark');
				expect(audit.value(surface, 'light')).toBe('#111111');
				expect(audit.value(surface, 'dark')).toBe('#222222');
				audit.handlePreview(surface, '#333333', 'light');
				audit.handlePreview(surface, '#444444', 'dark');
				audit.handleCancelPreview(surface, 'light');
				expect(audit.liveChanges.value.light[surface.name]).toBe('#111111');
				expect(audit.liveChanges.value.dark[surface.name]).toBe('#444444');
				audit.handleCommit(surface, 'invalid', 'light');
				expect(audit.errors[audit.errorKey(surface, 'light')]).toBeTruthy();
				expect(audit.errors[audit.errorKey(surface, 'dark')]).toBeUndefined();
			});
		it('renders both parameter modes and compact controls without a separate toolbar',
			async () => {
				wrapper = mount(ThemeAudit, { shallow: true, global: { stubs: { 'vc-input': false, 'vc-scroller': false } } });
				expect(wrapper.find('.audit-toolbar').exists()).toBe(false);
				expect(wrapper.find('.audit-panel').text()).toContain('73 个组件');
				expect(wrapper.find('.audit-panel__heading > p').text()).toBe('3 个参数 · 73 个组件');
				expect(wrapper.text()).not.toContain('配置自动保存在本地');
				expect(wrapper.text()).not.toContain('取消取色恢复预览');
				expect(wrapper.text()).not.toContain('关闭本页弹层');
				const actions = wrapper.find('.audit-config-buttons').findAllComponents(Button);
				expect(actions).toHaveLength(1);
				expect(actions[0].props('size')).toBe('small');
				const clipboard = wrapper.findComponent(Clipboard);
				expect(clipboard.props('tag')).toBe(Button);
				expect(clipboard.props('value')).toMatch(/^\$theme: \(/);
				expect(clipboard.attributes('size')).toBe('small');
				expect(wrapper.find('.audit-copy-status').exists()).toBe(false);
				const scroller = wrapper.findComponent(Scroller);
				expect(scroller.classes()).toContain('audit-panel__scroller');
				expect(scroller.find('summary').exists()).toBe(false);
				expect(scroller.find('[aria-label="搜索参数"]').exists()).toBe(false);
				expect(scroller.findAll('.audit-parameter')).toHaveLength(3);
				expect(scroller.findAll('.audit-parameter').map(parameter => parameter.attributes('data-parameter'))).toEqual([
					'color-neutral-light', 'color-primary', 'background-color-lightest'
				]);
				expect(wrapper.find('.audit-panel__heading summary').text()).toContain('查看导出代码');
				expect(wrapper.find('.audit-panel__heading [aria-label="搜索参数"]').exists()).toBe(true);
				expect(scroller.findAllComponents(Button).map(button => button.props('size'))).toEqual(['mini', 'mini', 'mini']);
				const groups = wrapper.findAllComponents(RadioGroup);
				expect(groups.map(group => group.props('modelValue'))).toEqual(['light', 'scss']);
				groups[0].vm.$emit('update:modelValue', 'dark');
				groups[1].vm.$emit('update:modelValue', 'css');
				await nextTick();
				expect(wrapper.find('.theme-audit').attributes('data-preview-mode')).toBe('dark');
				expect(wrapper.find('.theme-audit').classes()).toContain('is-dark');
				expect((wrapper.find('.audit-code').element as HTMLTextAreaElement).value).toMatch(/^:root \{/);
				expect(clipboard.props('value')).toMatch(/^:root \{/);
				expect(wrapper.findAllComponents(ColorPicker)).toHaveLength(5);
				const light = wrapper.find('#audit-background-color-lightest-light');
				const dark = wrapper.find('#audit-background-color-lightest-dark');
				await light.setValue('#abcdef');
				await light.trigger('blur');
				await dark.setValue('#123456');
				await dark.trigger('blur');
				expect((light.element as HTMLInputElement).value).toBe('#abcdef');
				expect((dark.element as HTMLInputElement).value).toBe('#123456');
				await light.setValue('invalid');
				await light.trigger('blur');
				expect(light.attributes('aria-invalid')).toBe('true');
				expect(dark.attributes('aria-invalid')).toBe('false');
			});
		it('groups and exports neutral overrides independently for both themes', async () => {
			wrapper = mount(ThemeAudit, { shallow: true, global: { stubs: { 'vc-input': false, 'vc-scroller': false } } });
			const parameter = wrapper.find('[data-parameter="color-neutral-light"]');
			expect(parameter.element.closest('.audit-parameter-group')!.querySelector('h3')!.textContent).toContain('颜色 · color-*');
			for (const [mode, value] of [['light', '#123456'], ['dark', '#abcdef']]) {
				const input = parameter.find(`#audit-color-neutral-light-${mode}`);
				await input.setValue(value);
				await input.trigger('blur');
			}
			expect(wrapper.findComponent(Clipboard).props('value')).toContain('color-neutral-light: (light: #123456, dark: #abcdef)');
			const override = document.querySelector('style[data-theme-audit]')!.textContent!;
			expect(override).toContain('--vc-color-neutral-light: #123456');
			expect(override).toContain('--vc-color-neutral-light: #abcdef');
		});
		it('copies and resets without toggling the fixed export section or adding a feedback row', async () => {
			const original = document.execCommand;
			const copy = vi.fn(() => true);
			document.execCommand = copy;
			const feedback = vi.spyOn(Message, 'success').mockImplementation(() => ({} as any));
			wrapper = mount(ThemeAudit, {
				shallow: true, global: {
					stubs: { 'vc-clipboard': false, 'vc-button': false, 'vc-debounce': false, 'vc-input': false, 'vc-scroller': false }
				}
			});
			try {
				const details = wrapper.find('details').element as HTMLDetailsElement;
				const clipboard = wrapper.findComponent(Clipboard);
				await clipboard.find('button').trigger('click');
				expect(copy).toHaveBeenCalledWith('copy');
				expect(feedback).toHaveBeenCalledWith({ content: '复制成功' });
				expect(details.open).toBe(false);
				expect(wrapper.find('.audit-copy-status').exists()).toBe(false);
				const light = wrapper.find('#audit-background-color-lightest-light');
				await light.setValue('#abcdef');
				await light.trigger('blur');
				expect(clipboard.props('value')).toContain('#abcdef');
				await wrapper.find('.audit-config-buttons').findComponent(Button).trigger('click');
				expect((light.element as HTMLInputElement).value).toBe('#fff');
				expect(clipboard.props('value')).not.toContain('#abcdef');
				expect(details.open).toBe(false);
			} finally {
				if (original) document.execCommand = original;
				else Reflect.deleteProperty(document, 'execCommand');
			}
		});
		it('loads saved values and follows system theme changes',
			async () => {
				localStorage.setItem(STORAGE_KEY,
					JSON.stringify({
						mode: 'system',
						changes: { shared: { 'color-primary': '#123456' } }
					}));
				start();
				await nextTick();
				expect(document.body.hasAttribute('data-vc-theme')).toBe(false);
				expect(audit.value(primary)).toBe('#123456');
				media.matches = true;
				media.addEventListener.mock.calls[0][1]();
				expect(audit.effectiveMode.value).toBe('dark');
			});
		it('keeps editing and exporting available when storage is unavailable',
			async () => {
				vi.stubGlobal('localStorage',
					{
						getItem() { throw new Error('blocked'); },
						setItem() { throw new Error('blocked'); },
						removeItem() {}
					});
				start();
				audit.handleCommit(primary,
					'#123456');
				await nextTick();
				expect(audit.storageMessage.value).toContain('本地存储不可用');
				expect(audit.value(primary)).toBe('#123456');
			});
		it('restores body state and removes styles and media listeners on unmount',
			async () => {
				document.body.setAttribute('data-vc-theme',
					'dark');
				start();
				audit.mode.value = 'light';
				await nextTick();
				wrapper.unmount();
				expect(document.body.getAttribute('data-vc-theme')).toBe('dark');
				expect(document.body.classList.contains('vc-theme-audit-page')).toBe(false);
				expect(document.querySelector('style[data-theme-audit]')).toBeNull();
				expect(media.removeEventListener).toHaveBeenCalledWith('change',
					media.addEventListener.mock.calls[0][1]);
			});
	});
