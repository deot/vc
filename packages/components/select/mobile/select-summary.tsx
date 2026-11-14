/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { useLocale } from '../../locale';

const COMPONENT_NAME = 'vcm-select-summary';

/**
 * 移动端选择弹层的汇总栏（内部组件，MSelectView 与 MTreeSelect 共用）
 * 	- 多选：左侧已选数量（有上限时带上限）
 * 	- clearable 且有已选项：右侧「清空」
 * 	- 两者都没有时不渲染
 */
export const MSelectSummary = defineComponent({
	name: COMPONENT_NAME,
	props: {
		// 已选数量
		count: {
			type: Number,
			default: 0
		},
		// 数量上限，0 为不限（只在多选时显示）
		max: {
			type: Number,
			default: 0
		},
		multiple: {
			type: Boolean,
			default: false
		},
		clearable: {
			type: Boolean,
			default: false
		}
	},
	emits: ['clear'],
	setup(props, { emit }) {
		const { t } = useLocale();
		const handleClear = () => emit('clear');

		return () => {
			const hasClear = props.clearable && props.count > 0;
			if (!props.multiple && !hasClear) return null;
			const { count, max } = props;
			return (
				<div class="vcm-select-summary">
					<span class="vcm-select-summary__count">
						{
							props.multiple && (
								max > 0
									? t('vc.Select.selectedMax', { count, max })
									: t('vc.Select.selected', { count })
							)
						}
					</span>
					{ hasClear && (<span class="vcm-select-summary__clear" onClick={handleClear}>{ t('vc.Select.clearText') }</span>) }
				</div>
			);
		};
	}
});
