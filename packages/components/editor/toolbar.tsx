/** @jsxImportSource vue */

import { defineComponent, computed, onUnmounted, onMounted } from 'vue';
import * as Load from '@deot/helper-load';
import { cloneDeep } from 'lodash-es';
import { getUid } from '@deot/helper-utils';
import { insertFontSizeStyle, insertLineHeightStyle, insertLetterSpacingStyle } from './utils';
import { defaults, toolbarDefaultsMap } from './default-options';

const COMPONENT_NAME = 'vc-editor-toolbar';

export const EditorToolbar = defineComponent({
	name: COMPONENT_NAME,
	props: {
		options: [Array, Object],
		elementId: String
	},
	setup(props, { slots }) {
		const buttons = computed(() => {
			let array: any = defaults.toolbar;
			if (props.options instanceof Array) {
				array = props.options;
			} else if (typeof props.options === 'object' && props.options.container instanceof Array) {
				array = props.options.container;
			}

			try {
				return cloneDeep(array);
			} catch (e) {
				console.log(e);
			}
			return array;
		});

		const styleId = getUid('editor-toolbar-style');
		const lineHeightStyleId = getUid('editor-toolbar-style');
		const letterSpacingStyleId = getUid('editor-toolbar-style');

		const renderButtonGroup = (list: any[]) => {
			return list.map((item: any) => {
				if (typeof item === 'string') {
					if (item.includes('upload')) {
						return slots.upload?.({ type: item.split('/')[1] });
					} else if (item === 'undo') {
						return slots.undo?.();
					} else if (item === 'redo') {
						return slots.redo?.();
					} else if (!toolbarDefaultsMap[item]) {
						return (<button class={`ql-${item}`} />);
					} else {
						item = { [item]: toolbarDefaultsMap[item] };
					}
				}

				if (Array.isArray(item)) {
					return (

						<span class="ql-formats">
							{renderButtonGroup(item)}
						</span>
					);
				}

				if (typeof item === 'object') {
					const [key, value] = Object.entries<any>(item)[0];
					const options = (value.length && value) || toolbarDefaultsMap[key];
					if (typeof value === 'string') {
						return <button class={`ql-${key}`} value={value} />;
					};
					if (value instanceof Array) {
						return (
							<select class={`ql-${key}`}>
								{
									options.map((it: string) => {
										if (it === 'selected' || !it) {
											return <option selected={true} />;
										}
										const v = key === 'line-height' ? (+it * 10) : it;
										return <option value={`${v}`} />;
									})
								}
							</select>
						);
					}
				}
				return null;
			});
		};

		const insertStyle = (list: any[]) => {
			list.forEach((item: any) => {
				if (Array.isArray(item)) {
					return insertStyle(item);
				}
				if (typeof item === 'object') {
					const [key, value] = Object.entries<any>(item)[0];
					const options = (value.length && value) || toolbarDefaultsMap[key];
					if (key === 'font-size') {
						insertFontSizeStyle(options, styleId);
					} else if (key === 'line-height') {
						insertLineHeightStyle(options, lineHeightStyleId);
					} else if (key === 'letter-spacing') {
						insertLetterSpacingStyle(options, letterSpacingStyleId);
					}
				}
			});
		};

		onMounted(() => {
			insertStyle(buttons.value);
		});

		onUnmounted(() => {
			Load.removeStyle(styleId);
			Load.removeStyle(lineHeightStyleId);
			Load.removeStyle(letterSpacingStyleId);
		});

		return () => {
			return (
				<div id={props.elementId}>
					{renderButtonGroup(buttons.value)}
					{slots?.extend?.()}
				</div>
			);
		};
	}
});
