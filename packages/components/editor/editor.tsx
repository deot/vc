/** @jsxImportSource vue */

import { defineComponent, nextTick, ref, shallowRef, inject, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import type Quill from 'quill';
import { defaults } from './default-options';
import { VcInstance } from '../vc/index';
import { uploadFile, insertFile, registerExtends, EXTENDS_CONTEXT_KEY } from './extends';
import { Spin } from '../spin';
import { props as editorProps } from './editor-props';
import { resolveEnhancer } from '../upload-picker/utils';
import type { PickerType } from '../upload-picker/types';
import { useLocale } from '../locale';
import { getEditorHTML } from './utils';
import { EditorToolbar, EditorPrompt, useFormats, parseToolbar } from './toolbar';
import type { FormatValue, PromptMode } from './toolbar';

const COMPONENT_NAME = 'vc-editor';

export const Editor = defineComponent({
	name: COMPONENT_NAME,
	props: editorProps,
	defaults,
	emits: [
		'ready',
		'blur',
		'focus',
		'input',
		'update:modelValue',
		'change'
	],
	setup(props, { slots, emit, expose }) {
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
			if (await enhancer?.({ instance: instance!, type, types: [type] })) return;
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
				<div class={['vc-editor', { 'is-disabled': props.disabled }]}>
					{
						slots.toolbar
							? slots.toolbar({ formats: formats.value, format: handleFormat, editor: editor.value })
							: hasLoad.value && (
								<EditorToolbar
									groups={groups.value}
									formats={formats.value}
									isActive={isActive}
									disabled={props.disabled}
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
					<div ref={editorEl} />
					{ editor.value && <EditorPrompt ref={prompt} editor={editor.value} disabled={props.disabled} /> }
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
	}
});
