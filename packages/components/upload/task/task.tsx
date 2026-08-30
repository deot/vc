/** @jsxImportSource vue */

import { computed, defineComponent, ref } from 'vue';
import { Portal } from '../../portal';
import { TransitionFade } from '../../transition';
import type {
	UploadTaskItem,
	UploadTaskSource,
	UploadTaskStatus
} from './types';
import { isTaskListSettled, isTaskSettled } from './utils';
import './style.scss';

const COMPONENT_NAME = 'vc-upload-task';

const normalizePercent = (value: number) => Math.min(100, Math.max(0, Number(value) || 0));
const createTask = (file: UploadTaskSource): UploadTaskItem => ({
	uploadId: file.uploadId,
	name: file.name,
	size: file.size,
	percent: normalizePercent(file.percent),
	status: 'pending',
	message: ''
});
const formatSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`;
const getStatusText = (task: UploadTaskItem) => {
	if (task.status === 'error') return task.message;
	if (task.status === 'success') return '✓';
	if (task.status === 'pending') return '等待中';
	return '上传中';
};

export const UploadTaskView = defineComponent({
	name: COMPONENT_NAME,
	emits: ['close'],
	setup(_, { emit, expose }) {
		const isVisible = ref(false);
		const showResult = ref(false);
		const tasks = ref<UploadTaskItem[]>([]);

		const successCount = computed(() => tasks.value.filter(item => item.status === 'success').length);
		const errorCount = computed(() => tasks.value.filter(item => item.status === 'error').length);

		const findTask = (uploadId: string) => tasks.value.find(item => item.uploadId === uploadId);
		const setStatus = (uploadId: string, status: UploadTaskStatus, message = '') => {
			const task = findTask(uploadId);
			if (!task) return;

			task.status = status;
			task.message = message;
			if (status === 'success') {
				task.percent = 100;
			}
		};

		const show = (files: UploadTaskSource[]) => {
			/*
			 * View 只合并数据；每个 Context 负责移除自身旧任务，保证多个 Upload 相互隔离。
			 */
			const nextTasks = [...tasks.value];

			files.forEach((file) => {
				const index = nextTasks.findIndex(item => item.uploadId === file.uploadId);
				const task = createTask(file);
				if (index >= 0) {
					nextTasks[index] = task;
				} else {
					nextTasks.push(task);
				}
			});

			tasks.value = nextTasks;
			showResult.value = false;
			isVisible.value = true;
		};

		const hide = () => {
			isVisible.value = false;
			emit('close');
		};

		const clear = () => {
			tasks.value = [];
			showResult.value = false;
		};
		const syncResult = () => {
			showResult.value = isTaskListSettled(tasks.value);
		};
		const remove = (uploadIds: string[]) => {
			const target = new Set(uploadIds);
			tasks.value = tasks.value.filter(item => !target.has(item.uploadId));
			if (tasks.value.length === 0) {
				showResult.value = false;
				isVisible.value = false;
				return true;
			}
			syncResult();
			return false;
		};
		const update = (file: UploadTaskSource) => {
			const task = findTask(file.uploadId);
			if (!task) return;

			task.name = file.name;
			task.size = file.size;
			task.percent = normalizePercent(file.percent);
		};

		const start = (uploadId: string) => setStatus(uploadId, 'uploading');
		const progress = (uploadId: string, percent: number) => {
			const task = findTask(uploadId);
			if (!task || isTaskSettled(task.status)) return;

			task.status = 'uploading';
			task.percent = normalizePercent(percent);
		};
		const success = (uploadId: string) => setStatus(uploadId, 'success');
		const error = (uploadId: string, message = '上传失败') => setStatus(uploadId, 'error', message);
		const complete = () => syncResult();

		/*
		 * Portal Leaf 仅通过这些闭包操作任务状态，不依赖 Vue 组件实例内部结构。
		 */
		expose({ show, hide, clear, remove, update, start, progress, success, error, complete });

		return () => (
			<TransitionFade>
				{
					isVisible.value && (
						<section class={COMPONENT_NAME} aria-label="上传任务">
							<header class={`${COMPONENT_NAME}__header`}>
								<span>当前上传进度</span>
								<button type="button" aria-label="关闭" onClick={hide}>×</button>
							</header>
							{
								showResult.value && (
									<div class={`${COMPONENT_NAME}__result`}>
										<span>{`上传结束，成功：${successCount.value}，失败：${errorCount.value}，总数：${tasks.value.length}`}</span>
										<button type="button" aria-label="关闭上传结果" onClick={() => (showResult.value = false)}>×</button>
									</div>
								)
							}
							<div class={[`${COMPONENT_NAME}__columns`, `${COMPONENT_NAME}__row`]}>
								<div>文件名</div>
								<div>文件大小</div>
								<div>状态</div>
							</div>
							<ul class={`${COMPONENT_NAME}__list`}>
								{
									tasks.value.map(task => (
										<li key={task.uploadId}>
											<div
												class={`${COMPONENT_NAME}__bar`}
												style={{ width: `${task.status === 'error' ? 100 : task.percent}%` }}
											/>
											<div class={`${COMPONENT_NAME}__row`}>
												<div title={task.name}>{task.name}</div>
												<div>{formatSize(task.size)}</div>
												<div
													title={task.message || undefined}
													class={[`${COMPONENT_NAME}__status`, `is-${task.status}`]}
												>
													{getStatusText(task)}
												</div>
											</div>
										</li>
									))
								}
							</ul>
						</section>
					)
				}
			</TransitionFade>
		);
	}
});

/**
 * Task 浮层直接使用 Portal 单例，Context 负责复用当前 Leaf 和恢复任务状态。
 */
export const UploadTask = new Portal(UploadTaskView, {
	leaveDelay: 0,
	autoDestroy: false
});
