import type { UploadTaskItem, UploadTaskStatus } from './types';

/**
 * 判断任务是否仍需要等待上传结算。
 * @param status - 当前任务状态。
 * @returns 是否为等待或上传中状态。
 */
export const isTaskActive = (status: UploadTaskStatus) => {
	return status === 'pending' || status === 'uploading';
};

/**
 * 判断任务是否已经完成结算。
 * @param status - 当前任务状态。
 * @returns 是否为成功或失败状态。
 */
export const isTaskSettled = (status: UploadTaskStatus) => {
	return status === 'success' || status === 'error';
};

/**
 * 空列表不属于已完成，防止清空任务时误展示结果栏。
 * @param tasks - 需要检查的任务列表。
 * @returns 列表是否包含任务且全部完成结算。
 */
export const isTaskListSettled = (
	tasks: readonly Pick<UploadTaskItem, 'status'>[]
) => {
	return tasks.length > 0 && tasks.every(task => isTaskSettled(task.status));
};
