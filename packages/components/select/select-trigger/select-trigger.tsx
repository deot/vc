/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch } from 'vue';
import type { PropType } from 'vue';
import { Input } from '../../input/index';
import { Icon } from '../../icon/index';
import { Spin } from '../../spin/index';
import { Customer } from '../../customer/index';
import { valueType } from '../../customer/customer-props';
import { SelectTags } from './select-tags';
import type { SelectTag } from './select-tags';

const COMPONENT_NAME = 'vc-select-trigger';

// 多选时，内联的搜索输入框在弹层打开期间预留的最小宽度
const SEARCH_MIN_WIDTH = 64;

/**
 * 点击可输入文字的节点以外的位置时不转移焦点（焦点留在搜索输入框）；复选框等仍可点击
 * @param e ~
 */
export const keepFocus = (e: MouseEvent) => {
	const el = e.target as HTMLInputElement;
	const isEditable = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !/^(checkbox|radio)$/.test(el.type));
	!isEditable && e.preventDefault();
};

/**
 * Select / TreeSelect / Cascader 的触发器：回显（单选文字 / 多选标签）、内联搜索、后缀图标
 */
export const SelectTrigger = defineComponent({
	name: COMPONENT_NAME,
	props: {
		// 所属组件的类名（如 vc-select）：沿用其 __input / __tags / __append / __icon / __prepend 类名与主题命名空间
		name: {
			type: String,
			required: true
		},
		id: String,
		disabled: Boolean,
		placeholder: String,
		searchPlaceholder: String,
		label: valueType,
		// 单选的回显文字
		text: {
			type: String,
			default: ''
		},
		// 多选的标签；不传为单选
		tags: Array as PropType<SelectTag[]>,
		maxTags: Number,
		maxTagLines: Number,
		// 在触发器内直接输入搜索
		searchable: Boolean,
		searchValue: {
			type: String,
			default: ''
		},
		// 弹层是否打开
		active: Boolean,
		// 焦点是否在触发器内（多选时搜索输入框在标签区内，外层 Input 感知不到它的焦点）
		focused: Boolean,
		loading: Boolean,
		clearable: Boolean
	},
	emits: ['search', 'clear', 'remove'],
	setup(props, { emit, slots, expose }) {
		// 可聚焦的 Input：多选且内联搜索时是标签之后的搜索输入框，否则是外层
		const input = ref<any>();

		const showTags = computed(() => {
			return !!props.tags && (props.tags.length > 0 || props.searchable);
		});

		const hasValue = computed(() => {
			return props.tags ? props.tags.length > 0 : !!props.text;
		});

		const classes = computed(() => {
			return {
				'is-focus': props.active || props.focused,
				'is-active': props.active,
				'is-searchable': props.searchable,
				// 内联搜索时输入框的值是搜索词，回显文字走 placeholder；弹层未打开时按正常文字显示（禁用时沿用占位色，与禁用文字一致）
				'is-value': props.searchable && !props.active && !props.disabled && hasValue.value
			};
		});

		const placeholder = computed(() => {
			if (!props.searchable) return props.placeholder;
			if (hasValue.value) return props.tags ? '' : props.text;
			return (props.active && props.searchPlaceholder) || props.placeholder;
		});

		const icon = computed(() => {
			return props.searchable && props.active ? 'search' : props.active ? 'up' : 'down';
		});

		const focus = () => {
			input.value?.focus({ preventScroll: true });
		};

		const handleSearch = (v: string) => {
			emit('search', v);
		};

		// 内联搜索：弹层打开后点击输入区不再关闭（冒泡到 Popover 会切换为关闭）
		const handleClick = (e: MouseEvent) => {
			if (!props.searchable || props.disabled) return;
			focus();
			props.active && e.stopPropagation();
		};

		const handleMousedown = (e: MouseEvent) => {
			props.searchable && keepFocus(e);
		};

		// 输入为空时退格：移除最后一个；长按删除文字时不连带移除
		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key !== 'Backspace' || e.repeat || e.isComposing || props.searchValue || !props.tags?.length) return;
			emit('remove', props.tags[props.tags.length - 1]);
		};

		const handleClear = (e: MouseEvent) => {
			e.stopPropagation();
			emit('clear');
		};

		const handleRemove = (item: SelectTag) => {
			emit('remove', item);
		};

		watch(
			() => props.active,
			v => v && props.searchable && focus()
		);

		expose({ focus });

		const renderPrepend = () => {
			return slots.prepend
				? slots.prepend()
				: (
						<div class={`${props.name}__prepend`}>
							<Customer wrap tag="span" class={`${props.name}__label`} render={props.label} />
						</div>
					);
		};

		const renderSearch = () => {
			return (
				<Input
					ref={input}
					styleless
					class="vc-select-trigger__search"
					disabled={props.disabled}
					modelValue={props.searchValue}
					allow-dispatch={false}
					// @ts-ignore
					placeholder={placeholder.value}
					onInput={handleSearch}
					onKeydown={handleKeydown}
				/>
			);
		};

		const renderTags = () => {
			return (
				<SelectTags
					class={[{ 'is-disabled': props.disabled }, `${props.name}__tags`]}
					data={props.tags}
					maxTags={props.maxTags}
					maxTagLines={props.maxTagLines}
					closable={!props.disabled}
					reserve={props.searchable && props.active ? SEARCH_MIN_WIDTH : 0}
					onClose={handleRemove}
				>
					{{ default: props.searchable ? renderSearch : void 0 }}
				</SelectTags>
			);
		};

		// 清空图标由样式在悬停时替换后缀图标，悬停不触发渲染；加载中只显示加载图标
		const renderAppend = () => {
			return (
				<div class={[`${props.name}__append`, 'vc-select-trigger__append']} onMousedown={handleMousedown}>
					{
						props.clearable && !props.disabled && !props.loading && (
							<Icon
								type="clear"
								class={[`${props.name}__icon`, 'vc-select-trigger__clear']}
								// @ts-ignore
								onClick={handleClear}
							/>
						)
					}
					{
						props.loading
							? (<Spin size={12} class="vc-select-trigger__icon" />)
							: (
									<Icon
										type={icon.value}
										class={[{ 'is-arrow': icon.value !== 'search' }, `${props.name}__icon`, 'vc-select-trigger__icon']}
									/>
								)
					}
				</div>
			);
		};

		return () => {
			return (
				<Input
					ref={showTags.value ? void 0 : input}
					id={props.id}
					disabled={props.disabled}
					modelValue={props.searchable ? props.searchValue : props.text}
					allow-dispatch={false}
					class={[classes.value, `${props.name}__input`, 'vc-select-trigger']}
					// @ts-ignore
					readonly={!props.searchable}
					placeholder={placeholder.value}
					onInput={handleSearch}
					onClick={handleClick}
					onMousedown={handleMousedown}
				>
					{{
						prepend: slots.prepend || props.label ? renderPrepend : null,
						content: showTags.value ? renderTags : null,
						append: renderAppend
					}}
				</Input>
			);
		};
	}
});
