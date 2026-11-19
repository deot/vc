/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { Popover } from '../../popover';
import { Icon } from '../../icon';
import type { FormatValue } from './utils';

const COMPONENT_NAME = 'vc-editor-color';

const handlePrevent = (e: MouseEvent) => e.preventDefault();

/**
 * 色块网格：桌面端放在 Popover 里，移动端放在底部弹出层里
 * @param options 取值；false 为默认（清除颜色）
 * @param current 当前颜色
 * @param onSelect 选中时调用
 * @returns ~
 */
export const renderColors = (options: FormatValue[], current: string | undefined, onSelect: (value: FormatValue) => void) => (
	<div class="vc-editor-color" onMousedown={handlePrevent}>
		{
			options.map(option => (
				<button
					type="button"
					key={String(option)}
					class={[
						'vc-editor-color__item',
						{
							'is-default': option === false,
							'is-selected': option === false ? !current : option === current
						}
					]}
					style={typeof option === 'string' ? { background: option } : undefined}
					onClick={() => onSelect(option)}
				/>
			))
		}
	</div>
);

// 文字颜色、背景色：触发按钮下方的色条显示当前颜色，浮层为色块网格；false 为默认（清除颜色）
export const EditorColor = defineComponent({
	name: COMPONENT_NAME,
	props: {
		name: {
			type: String as PropType<'color' | 'background'>,
			required: true
		},
		icon: String,
		options: {
			type: Array as PropType<FormatValue[]>,
			default: () => []
		},
		value: [String, Array],
		disabled: Boolean
	},
	emits: ['change'],
	setup(props, { emit }) {
		const isActive = ref(false);
		const handleSelect = (value: FormatValue) => {
			isActive.value = false;
			emit('change', value);
		};
		return () => {
			const current = typeof props.value === 'string' ? props.value : undefined;
			return (
				<Popover
					v-model={isActive.value}
					trigger="click"
					placement="bottom-left"
					disabled={props.disabled}
					portalClass={['is-padding-none', 'vc-editor-color-wrapper']}
				>
					{{
						default: () => (
							<button
								type="button"
								class={['vc-editor__tool', 'vc-editor__color', { 'is-active': isActive.value }]}
								disabled={props.disabled}
							>
								<Icon type={props.icon} class="vc-editor__icon" />
								<span class="vc-editor__color-bar" style={current ? { background: current } : undefined} />
							</button>
						),
						content: () => renderColors(props.options, current, handleSelect)
					}}
				</Popover>
			);
		};
	}
});
