import { toDate } from '../date-picker/helper/utils';

/**
 * 时间戳；空值（含默认的空字符串）与非法值为 NaN
 * @param date 'YYYY-MM-DD HH:mm:ss'、'YYYY/MM/DD'、ISO 字符串、Date 或时间戳
 * @returns ~
 */
export const getTimestamp = (date: string | Date | number) => toDate(date)?.getTime() ?? NaN;

export const formatter = (format: String, arr: any[]) => {
	// YYYY,MM
	return format
		.replace('DD', arr[0])
		.replace('HH', arr[1])
		.replace('mm', arr[2])
		.replace('ss', arr[3])
		.replace('SSS', arr[4]);
};
