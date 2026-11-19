/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { Icon } from '../../icon';
import { Dropdown, DropdownMenu, DropdownItem } from '../../dropdown';
import { useLocale } from '../../locale';
import { EditorColor } from './color-panel';
import { getIcon, UPLOAD_ICONS } from './utils';
import type { ToolbarItem, FormatValue, PromptMode } from './utils';
import type { Formats } from './use-formats';

const COMPONENT_NAME = 'vc-editor-toolbar';

// 选择项在 DropdownItem 上的取值：false（默认）为 ''
const toKey = (value: FormatValue) => (value === false ? '' : String(value));

// 在工具栏上按下不让编辑区失焦；输入类元素（extend 插槽里可能放）除外
const handlePrevent = (e: MouseEvent) => {
	const target = e.target as HTMLElement;
	target.closest?.('input, textarea, select, [contenteditable="true"]') || e.preventDefault();
};

export const EditorToolbar = defineComponent({
	name: COMPONENT_NAME,
	props: {
		groups: {
			type: Array as PropType<ToolbarItem[][]>,
			default: () => []
		},
		formats: {
			type: Object as PropType<Formats>,
			default: () => ({})
		},
		isActive: {
			type: Function as PropType<(name: string, value?: FormatValue) => boolean>,
			default: () => false
		},
		disabled: Boolean
	},
	emits: ['format', 'upload', 'action', 'prompt'],
	setup(props, { emit, slots }) {
		const { t } = useLocale();

		const getLabel = (name: string, value: FormatValue) => {
			switch (name) {
				case 'header':
					return value ? t('vc.Editor.heading', { level: value as number }) : t('vc.Editor.text');
				case 'font':
					return value ? t(`vc.Editor.${value}`) : t('vc.Editor.font');
				case 'size':
					return value ? t(`vc.Editor.${value}`) : t('vc.Editor.text');
				default:
					return value === false ? t('vc.Editor.text') : String(value);
			}
		};

		// 触发器上的文字：行高、字间距带前缀；未设置时显示第一个选项
		const getCurrentLabel = (name: string, options: FormatValue[]) => {
			const current = props.formats[name];
			const value = options.find(option => toKey(option) === toKey(current ?? false)) ?? options[0];
			const label = value === undefined ? '' : getLabel(name, value);
			if (name === 'line-height') return `${t('vc.Editor.lineHeight')}${label}`;
			if (name === 'letter-spacing') return `${t('vc.Editor.letterSpacing')}${label}`;
			return label;
		};

		const renderButton = (key: string, icon: string | undefined, active: boolean, onClick: () => void, text?: string) => (
			<button
				type="button"
				key={key}
				class={['vc-editor__tool', `is-${key.split(':')[0]}`, { 'is-active': active }]}
				disabled={props.disabled}
				aria-pressed={active}
				onClick={onClick}
			>
				{ icon ? <Icon type={icon} class="vc-editor__icon" /> : text }
			</button>
		);

		const renderSelect = (item: Extract<ToolbarItem, { type: 'select' }>) => {
			const { name, options } = item;
			const isIcon = name === 'align';
			const current = toKey(props.formats[name] ?? false);
			return (
				<Dropdown
					key={name}
					trigger="click"
					placement="bottom-left"
					caret={!isIcon}
					class={['vc-editor__select', `is-${name}`, { 'is-disabled': props.disabled }]}
					portalClass="vc-editor-dropdown"
					// disabled 透传给 Popover；click 为 Dropdown 的菜单项事件
					{...{
						disabled: props.disabled,
						onClick: (key: string) => emit('format', name, options.find(option => toKey(option) === key) ?? false)
					}}
				>
					{{
						default: () => (
							isIcon
								? <Icon type={getIcon(name, props.formats[name] ?? false)} class="vc-editor__icon" />
								: <span class="vc-editor__select-label">{getCurrentLabel(name, options)}</span>
						),
						content: () => (
							<DropdownMenu {...{ onMousedown: handlePrevent }}>
								{
									options.map(option => (
										<DropdownItem
											key={toKey(option)}
											value={toKey(option)}
											selected={toKey(option) === current}
										>
											{
												isIcon
													? <Icon type={getIcon(name, option)} class="vc-editor__icon" />
													: (
															<span
																class={[`vc-editor-dropdown__${name}`, `is-${toKey(option) || 'default'}`]}
																style={name === 'font' && option ? { fontFamily: String(option) } : undefined}
															>
																{getLabel(name, option)}
															</span>
														)
											}
										</DropdownItem>
									))
								}
							</DropdownMenu>
						)
					}}
				</Dropdown>
			);
		};

		const renderItem = (item: ToolbarItem) => {
			switch (item.type) {
				case 'button':
					return renderButton(
						`${item.name}:${item.value ?? ''}`,
						getIcon(item.name, item.value),
						props.isActive(item.name, item.value),
						() => emit('format', item.name, item.value, true),
						item.name
					);
				case 'select':
					return renderSelect(item);
				case 'color':
					return (
						<EditorColor
							key={item.name}
							name={item.name}
							icon={getIcon(item.name)}
							options={item.options}
							value={props.formats[item.name]}
							disabled={props.disabled}
							// @ts-ignore
							onChange={(value: FormatValue) => emit('format', item.name, value)}
						/>
					);
				case 'upload':
					return renderButton(`upload:${item.value}`, UPLOAD_ICONS[item.value], false, () => emit('upload', item.value));
				case 'prompt':
					return renderButton(
						item.name,
						getIcon(item.name),
						item.name === 'link' && props.isActive('link'),
						() => emit('prompt', item.name as PromptMode)
					);
				case 'action':
					return renderButton(item.name, getIcon(item.name), false, () => emit('action', item.name));
				default:
					return null;
			}
		};

		return () => (
			<div class={['vc-editor__toolbar', { 'is-disabled': props.disabled }]} onMousedown={handlePrevent}>
				<div class="vc-editor__tools">
					{
						props.groups.map((group, index) => (
							<span key={index} class="vc-editor__group">
								{group.map(renderItem)}
							</span>
						))
					}
					{slots.extend?.()}
				</div>
			</div>
		);
	}
});
