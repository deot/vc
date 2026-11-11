import { getUid } from '@deot/helper-utils';
import type { PickerEnhancer, PickerType } from './types';

export const PICKER_ITEM_KEY = '__vcUploadPickerKey';

// 为排序和渲染提供内部稳定主键，不污染对外输出对象
export const withPickerItemKey = <T extends Record<string, any>>(item: T, key?: string): T => {
	Object.defineProperty(item, PICKER_ITEM_KEY, {
		value: key || item.uploadId || getUid(),
		configurable: true
	});
	return item;
};

/**
 * 上传成功、可以预览的项：没有失败标记，且有字符串地址
 * @param row 列表项
 * @param valueKey 地址字段
 * @returns ~
 */
export const isDoneItem = (row: Record<string, any>, valueKey: string) => {
	const value = row[valueKey];
	return row.status !== 0 && !row.errorFlag && typeof value === 'string' && !!value;
};

/**
 * 文件项的显示状态，两端共用
 * @param row 列表项
 * @param keyValue 取文件名、地址的字段
 * @param keyValue.label ~
 * @param keyValue.value ~
 * @returns label 文件名；isError 上传失败；isDone 已有地址；percent 上传进度（0～100 的整数）
 */
export const getRowState = (row: Record<string, any>, keyValue: { label: string; value: string }) => {
	const isDone = isDoneItem(row, keyValue.value);
	return {
		label: row[keyValue.label] || row.name || row[keyValue.value],
		isError: row.status === 0 || !!row.errorFlag,
		isDone,
		percent: Math.min(100, Math.max(0, Math.round(Number(row.percent) || 0)))
	};
};

// 各类型默认的 accept；file 为常见文档：Word、Excel（含 csv）、PowerPoint、PDF、纯文本、HTML
export const ACCEPTS: Record<PickerType, string> = {
	image: 'image/*',
	video: 'video/*',
	audio: 'audio/*',
	file: [
		'.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'.csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'.pdf,application/pdf',
		'text/plain',
		'text/html'
	].join(',')
};

/**
 * 取出要执行的 enhancer：属性传了函数就用它；属性为真时用全局配置里第一个有值的
 * @param own 组件的 enhancer 属性
 * @param globals 全局配置里的候选，按优先级排列
 * @returns ~
 */
export const resolveEnhancer = (own: unknown, ...globals: Array<PickerEnhancer | undefined>) => {
	return typeof own === 'function' ? own as PickerEnhancer : own ? globals.find(Boolean) : void 0;
};
