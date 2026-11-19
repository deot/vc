/** @jsxImportSource vue */

import { nextTick, ref, shallowRef, inject, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import type { SetupContext } from 'vue';
import type Quill from 'quill';
import { defaults } from './default-options';
import { VcInstance } from '../vc/index';
import { uploadFile, insertFile, registerExtends, EXTENDS_CONTEXT_KEY } from './extends';
import { Spin } from '../spin';
import type { Props } from './editor-props';
import type { EditorComponents } from './types';
import { resolveEnhancer } from '../upload-picker/utils';
import type { PickerType } from '../upload-picker/types';
import { useLocale } from '../locale';
import { getEditorHTML } from './utils';
import { EditorToolbar, EditorPrompt, useFormats, parseToolbar } from './toolbar';
import { useKeyboardDock } from './toolbar/use-keyboard-dock';
import type { FormatValue, PromptMode } from './toolbar';

export const emits = ['ready', 'blur', 'focus', 'input', 'update:modelValue', 'change'] as const;

/**
 * Editor 与 MEditor 共用的状态与渲染
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param context.expose ~
 * @param options ~
 * @param options.mobile 移动端（MEditor）：根节点加标记类 vcm-editor，工具栏单行横向滚动、选择项用动作面板，可停靠在键盘上方
 * @param options.components 移动端替换的组件（动作面板、弹出层、输入框、按钮、图片预览）
 * @returns render
 */
export const useEditor = (
	props: Props,
	{ slots, emit, expose }: SetupContext<typeof emits[number][]>,
	options: { mobile?: boolean; components?: Partial<EditorComponents> } = {}
) => {
	const mobile = !!options.mobile;
	const { t } = useLocale();
	const instance = getCurrentInstance();
	const formItem = inject<any>('vc-form-item', {});
	const hasLoad = ref(false);
	const editorEl = ref(null);
	const prompt = ref<any>();
	const currentValue = ref('');
	// 并发上传各自开始、结束，计数归零才隐藏加载
	const loadingCount = ref(0);
	const isFocused = ref(false);
	const holder = ref<HTMLElement>();

	const quillInstance = shallowRef<typeof Quill>();
	const editor = shallowRef<Quill>();
	const currentOptions = computed<typeof defaults>(() => {
		const baseOptions = VcInstance.options?.Editor?.options || {};
		const modules = {
			...defaults.modules,
			...baseOptions.modules,
			...props.options?.modules
		};
		// 工具栏由组件渲染，不使用 Quill 的 toolbar 模块和主题
		delete modules.toolbar;
		return {
			...defaults,
			placeholder: t('vc.Editor.placeholder'),
			...(baseOptions || {}),
			...props.options,
			theme: undefined,
			modules
		};
	});
	const groups = computed(() => parseToolbar(currentOptions.value.toolbar));

	const { formats, format, isActive } = useFormats(editor, () => props.disabled);

	// 聚焦时停在虚拟键盘上方：只在移动端生效
	const isDocked = computed(() => mobile && props.toolbarPlacement === 'keyboard' && isFocused.value && !props.disabled);
	const dock = useKeyboardDock({ active: isDocked, holder, editor });

	watch(
		() => currentOptions.value.placeholder,
		(value) => {
			if (editor.value) {
				editor.value.root.dataset.placeholder = value ?? '';
			}
		}
	);

	watch(
		() => props.disabled,
		(v) => {
			if (editor.value) {
				editor.value.enable(!v);
			}
		}
	);

	watch(
		() => props.modelValue,
		(v) => {
			if (editor.value) {
				if (v && v !== currentValue.value) {
					currentValue.value = v;
					editor.value.clipboard.dangerouslyPasteHTML(v);
				} else if (!v) {
					editor.value.setText('');
				}
			}
		}
	);

	const effects: any[] = [];
	const getContext = () => ({
		props,
		root: editorEl.value,
		options: currentOptions.value,
		previewable: props.previewable,
		poster: props.poster,
		ImagePreview: options.components?.ImagePreview,
		onLoading: () => loadingCount.value++,
		onLoaded: () => (loadingCount.value = Math.max(0, loadingCount.value - 1)),
		onUnmounted: (fn: any) => {
			effects.push(fn);
		}
	});

	const getFakeEventExtend = () => ({
		parent: getContext(),
		editor: editor.value,
	});

	const getInfo = () => ({ value: currentValue.value, editor: editor.value! });

	const handlePrompt = (mode: PromptMode) => {
		!props.disabled && prompt.value?.open(mode);
	};

	const init = () => {
		const QuillClass = quillInstance.value!;
		registerExtends(QuillClass, currentOptions.value.toolbar);
		props.register?.(QuillClass);
		editor.value = new QuillClass(editorEl.value!, {
			...currentOptions.value,
			// @ts-ignore 注入特有变量
			[EXTENDS_CONTEXT_KEY]: getContext()
		});
		editor.value.enable(!props.disabled);
		if (props.modelValue) {
			editor.value.setText('');
			editor.value.clipboard.dangerouslyPasteHTML(props.modelValue);
			const length = editor.value.getLength();
			editor.value.setSelection(length + 1); // 光标位置
		}

		// Ctrl / Cmd + K 编辑链接
		editor.value.keyboard.addBinding({ key: 'k', shortKey: true }, () => {
			handlePrompt('link');
			return false;
		});

		// 选区每次移动都会触发，只在聚焦状态切换时发出事件
		editor.value.on('selection-change', (range) => {
			const focused = !!range;
			if (focused === isFocused.value) return;
			isFocused.value = focused;
			emit(focused ? 'focus' : 'blur', getInfo());
			!focused && formItem.blur?.(currentValue.value);
		});

		// 监听文本内容变化
		editor.value.on('text-change', () => {
			currentValue.value = getEditorHTML(editor.value!);

			emit('update:modelValue', currentValue.value);
			emit('input', getInfo());
			emit('change', getInfo());
			formItem.change?.(currentValue.value);
		});
	};

	const handleUpload = async (type: PickerType) => {
		if (props.disabled) return;
		const enhancer = resolveEnhancer(props.enhancer, VcInstance.options.Editor?.enhancer, VcInstance.options.UploadPicker?.enhancer);
		// 与 UploadPicker 的 enhancer 同一签名：每次只选一种类型
		if (await enhancer?.({ instance: instance!, type, types: [type], mobile })) return;
		// 默认上传
		uploadFile(type, getFakeEventExtend());
	};

	const handleAction = (name: 'undo' | 'redo' | 'clean') => {
		if (props.disabled || !editor.value) return;
		name === 'clean' ? format('clean') : editor.value.history[name]();
	};

	const handleFormat = (name: string, value?: FormatValue, toggle?: boolean) => {
		format(name, value, toggle);
	};

	onMounted(async () => {
		const quill = (window as any).quill || await import('quill');

		hasLoad.value = true;
		// 兼容webpack 3.0/4.0 写法
		quillInstance.value = quill.default ? quill.default : quill;

		await nextTick();
		init();
		emit('ready', { dependencies: { quill: quillInstance.value } });
	});

	onUnmounted(() => effects.forEach(fn => fn()));
	expose({
		editor,
		// 跟update-picker 对外暴露的增加方法保持同名（给enhancer）
		add: (source = []) => {
			// item = { value: '上传后的地址', target: '原始文件', type?: '文件类型' }
			source.forEach((item: any) => insertFile(item, getFakeEventExtend()));
		}
	});

	return () => {
		return (
			<div class={[mobile ? 'vc-editor vcm-editor' : 'vc-editor', { 'is-disabled': props.disabled }]}>
				<div
					ref={holder}
					class={['vc-editor__toolbar-holder', { 'is-docked': isDocked.value }]}
					style={isDocked.value ? { height: `${dock.height.value}px` } : undefined}
				>
					{
						slots.toolbar
							? slots.toolbar({ formats: formats.value, format: handleFormat, editor: editor.value })
							: hasLoad.value && (
								<EditorToolbar
									groups={groups.value}
									formats={formats.value}
									isActive={isActive}
									disabled={props.disabled}
									mobile={mobile}
									components={options.components}
									style={dock.style.value}
									// @ts-ignore
									onFormat={handleFormat}
									onUpload={handleUpload}
									onAction={handleAction}
									onPrompt={handlePrompt}
								>
									{{ extend: slots.extend }}
								</EditorToolbar>
							)
					}
				</div>
				<div ref={editorEl} />
				{
					editor.value && (
						<EditorPrompt
							ref={prompt}
							editor={editor.value}
							disabled={props.disabled}
							mobile={mobile}
							components={options.components}
						/>
					)
				}
				<div
					// @ts-ignore
					vShow={loadingCount.value > 0}
					class="vc-editor__spin"
				>
					<Spin />
				</div>
			</div>
		);
	};
};
