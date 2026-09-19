import type { Language } from '../types';

export const zhCN: Language = {
	name: 'zh-CN',
	vc: {
		Select: {
			placeholder: '请选择',
			selectAll: '全选',
			deselectAll: '取消全选'
		},
		InputNumber: {
			maxExceeded: '数值不能超过{max}',
			minExceeded: '数值不能低于{min}',
			cannotIncrease: '不能再多了',
			cannotDecrease: '不能再少了'
		},
		MInputSearch: {
			cancelText: '取消'
		},
		Snapshot: {
			generating: '正在生成...'
		},
		Drawer: {
			okButtonText: '确定',
			cancelButtonText: '取消'
		},
		Countdown: {
			format: 'DD天HH小时mm分ss秒SSS'
		},
		Calendar: {
			months: {
				january: '一月',
				february: '二月',
				march: '三月',
				april: '四月',
				may: '五月',
				june: '六月',
				july: '七月',
				august: '八月',
				september: '九月',
				october: '十月',
				november: '十一月',
				december: '十二月'
			},
			weekdays: {
				sunday: '日',
				monday: '一',
				tuesday: '二',
				wednesday: '三',
				thursday: '四',
				friday: '五',
				saturday: '六'
			}
		},
		Clipboard: {
			copySuccess: '复制成功'
		},
		Image: {
			loadError: '加载失败'
		},
		Modal: {
			okButtonText: '确定',
			cancelButtonText: '取消'
		}
	}
};
