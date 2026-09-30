import type { Language } from '../types';

export const zhCN: Language = {
	name: 'zh-CN',
	vc: {
		UploadPicker: {
			upload: '上传',
			failed: '上传失败',
			receiving: '服务器正在接收...',
			previewAudio: '预览音频',
			previewVideo: '预览视频'
		},
		Upload: {
			remoteError: '上传远程失败，请重试',
			sizeLimit: '上传失败，大小限制为{size}MB',
			serverError: '服务异常',
			aborted: '上传取消',
			timeout: '上传超时',
			requestError: '调用异常',
			parseError: '上传解析失败，请重试',
			failed: '上传失败',
			acceptLimit: '文件格式限制：{accept}',
			countLimit: '可选文件数量不能超过{max}个',
			directoryLimit: '文件夹内文件的数量不能超过{max}个',
			canceled: '上传已取消',
			loading: '上传中...',
			pending: '等待中',
			uploading: '上传中',
			taskLabel: '上传任务',
			taskTitle: '当前上传进度',
			close: '关闭',
			closeResult: '关闭上传结果',
			result: '上传结束，成功：{succeeded}，失败：{failed}，总数：{total}',
			fileName: '文件名',
			fileSize: '文件大小',
			status: '状态'
		},
		Tree: {
			emptyText: '暂无数据'
		},
		TreeSelect: {
			placeholder: '请选择',
			noMatch: '暂无匹配数据'
		},
		Table: {
			emptyText: '暂无数据',
			sumText: '合计',
			filterReset: '重置',
			filterConfirm: '确认',
			filterAll: '全部'
		},
		Pagination: {
			total: '共 {total} 条',
			previousPage: '上一页',
			nextPage: '下一页',
			previousPages: '向前 {count} 页',
			nextPages: '向后 {count} 页',
			pageSize: '{size} 条/页',
			goto: '跳至',
			page: '页'
		},
		RecycleList: {
			empty: '暂无数据~',
			complete: '已全部加载~',
			pullDown: '↓ 下拉刷新',
			pullUp: '↑ 上拉刷新',
			pullRight: '→ 右拉刷新',
			pullLeft: '← 左拉刷新',
			releaseUp: '↑ 释放更新',
			releaseDown: '↓ 释放更新',
			releaseLeft: '← 释放更新',
			releaseRight: '→ 释放更新',
			refreshing: '加载中...',
		},
		Editor: {
			videoPlaceholder: '嵌入视频地址',
			placeholder: '请输入内容',
			open: '打开：',
			edit: '编辑',
			remove: '删除',
			link: '链接',
			save: '保存',
			text: '文本',
			heading: '标题{level}',
			lineHeight: '行高：',
			letterSpacing: '字间距：',
			font: '标准字体',
			serif: '衬线字体',
			monospace: '等宽字体',
			small: '小',
			large: '大',
			huge: '特大',
			formula: '公式',
			video: '视频'
		},
		DatePicker: {
			clearText: '清空',
			selectDate: '选择日期',
			selectTime: '选择时间',
			startTime: '开始时间',
			endTime: '结束时间',
			weekdays: {
				sunday: '日',
				monday: '一',
				tuesday: '二',
				wednesday: '三',
				thursday: '四',
				friday: '五',
				saturday: '六'
			},
			placeholder: '请选择',
			cancelText: '取消',
			okText: '确定',
			year: '{value}年',
			month: '{value}月',
			day: '{value}日',
			hour: '{value}时',
			minute: '{value}分',
			second: '{value}秒',
			yearQuarter: '{year}年{quarter}',
			quarter: {
				first: '第一季度',
				second: '第二季度',
				third: '第三季度',
				fourth: '第四季度'
			}
		},
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
		Popconfirm: {
			okButtonText: '确定',
			cancelButtonText: '取消'
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
