/** @jsxImportSource vue */

import { defineComponent, nextTick, ref, shallowRef, inject, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import type Quill from 'quill';
import { getUid } from '@deot/helper-utils';
import { EditorToolbar } from './toolbar';
import { Icon } from '../icon/index';
import { defaults } from './default-options';
import { VcInstance } from '../vc/index';
import { uploadFile, insertFile, registerExtends, EXTENDS_CONTEXT_KEY } from './extends';
import { Spin } from '../spin';
import { props as editorProps } from './editor-props';

const COMPONENT_NAME = 'vc-editor';

export const Editor = defineComponent({
	name: COMPONENT_NAME,
	props: editorProps,
	emits: [
		'ready',
		'blur',
		'focus',
		'input',
		'update:modelValue',
		'change'
	],
	setup(props, { slots, emit, expose }) {
		const instance = getCurrentInstance();
		const formItem = inject<any>('vc-form-item', {});
		const hasLoad = ref(false);
		const editorEl = ref(null);
		const toolbar = ref<any>(null);
		const currentValue = ref('');
		const toolbarId = ref(getUid('editor-toolbar'));
		const isLoading = ref(false);

		const quillInstance = shallowRef<typeof Quill>();
		const editor = shallowRef<Quill>();
		const currentOptions = computed<typeof defaults>(() => {
			const baseOptions = VcInstance.options?.Editor?.options || {};
			return {
				...defaults,
				...(baseOptions || {}),
				...props.options,
				modules: {
					...defaults.modules,
					...baseOptions.modules,
					...props.options?.modules,
					// 自定义toolbar工具栏，options.modules.toolbar -> options.toolbar
					toolbar: `#${toolbarId.value}`
				}
			};
		});

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
			onLoading: () => (isLoading.value = true),
			onLoaded: () => (isLoading.value = false),
			onUnmounted: (fn: any) => {
				effects.push(fn);
			}
		});

		const getFakeEventExtend = () => ({
			parent: getContext(),
			editor: editor.value,
		});

		const mergeCurrentInfo = () => {
			return { value: currentValue.value, editor: editor.value };
		};

		const init = () => {
			const QuillClass = quillInstance.value!;
			registerExtends(QuillClass);
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

			editor.value.on('selection-change', (range) => {
				const current = mergeCurrentInfo();
				if (!range) {
					emit('blur', currentValue.value, current);
				} else {
					emit('focus', currentValue.value, current);
				}
			});

			// 监听文本内容变化
			editor.value.on('text-change', () => {
				let html = editor.value?.getSemanticHTML() || '';
				if (html === '<p><br></p>') html = '';
				currentValue.value = html;

				const current = mergeCurrentInfo();
				emit('update:modelValue', currentValue.value, current);
				emit('input', currentValue.value, current);
				emit('change', currentValue.value, current);
				formItem.change?.(currentValue.value);
			});
		};

		const handleUpload = async (e: any, type: string) => {
			const enhancer = VcInstance.options.Editor.enhancer || VcInstance.options.UploadPicker.enhancer;
			if (typeof props.enhancer === 'function' || (props.enhancer && enhancer)) {
				const fn = typeof props.enhancer === 'function' ? props.enhancer : enhancer;
				if (await fn(instance, type)) return;
			}
			// 默认上传
			uploadFile(type, getFakeEventExtend());
		};

		const handleUndo = () => {
			editor.value!.history.undo();
		};

		const handleRedo = () => {
			editor.value!.history.redo();
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
			toolbarId,
			// 跟update-picker 对外暴露的增加方法保持同名（给enhancer）
			add: (source = []) => {
				// item = { value: '上传后的地址', target: '原始文件', type?: '文件类型' }
				source.forEach((item: any) => insertFile(item, getFakeEventExtend()));
			}
		});

		return () => {
			return (
				<div class="vc-editor">
					{
						slots.toolbar
							? slots.toolbar()
							: (
									<EditorToolbar
										// @ts-ignore
										vShow={hasLoad.value}
										ref={toolbar}
										options={currentOptions.value.toolbar}
										elementId={toolbarId.value}
									>
										{{
											upload: ({ type }) => (
												<button class="vc-editor__icon">
													<Icon
														type={type}
														style="font-size: 15px"
														// @ts-ignore
														onClick={(e: any) => handleUpload(e, type)}
													/>
												</button>
											),
											undo: () => (
												<button class="vc-editor__icon" onClick={handleUndo}>
													<Icon type="undo" style="font-size: 15px" />
												</button>
											),
											redo: () => (
												<button class="vc-editor__icon" onClick={handleRedo}>
													<Icon type="redo" style="font-size: 15px" />
												</button>
											),
											extend: slots.extend
										}}
									</EditorToolbar>
								)
					}
					<div ref={editorEl} />
					<div
						// @ts-ignore
						vShow={isLoading.value}
						class="vc-editor__spin"
					>
						<Spin />
					</div>
				</div>
			);
		};
	}
});
