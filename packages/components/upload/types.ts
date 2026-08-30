import type { ComponentInternalInstance } from 'vue';

/**
 * Upload 为原始 File 附加的周期与进度信息。
 */
export interface UploadFile {
	uploadId: string;
	current: number;
	total: number;
	percent: number;
	size: number;
	name: string;
	target: File;
}

/**
 * 单个文件上传过程中对外派发的进度信息。
 */
export interface UploadProgress extends Pick<UploadFile, 'percent'> {
	progress: number;
	target: ProgressEvent;
}

/**
 * 单个上传周期的累计结果及调度队列。
 */
export interface UploadCycleResult {
	total: number;
	completed: number;
	succeeded: number;
	failed: number;
	responses: unknown[];
	queues: Array<() => void>;
}

/**
 * Upload 对外传递的标准错误信息。
 */
export interface UploadError {
	message?: string;
}

/**
 * Upload 入口提供的错误与 Loading 展示能力。
 */
export interface UploadFeedback {
	error: (message: string, duration: number) => unknown;
	loading: (message: string) => {
		destroy: () => void;
	};
}

/**
 * onRequest 可以读取或替换的请求参数。
 */
export interface UploadRequestOptions {
	url?: string;
	headers: Record<string, string>;
	body: Record<string, unknown>;
	timeout: number | null;
	file: File;
}

/**
 * onFileBefore 支持取消、替换二进制内容或覆盖文件信息。
 */
export type UploadFileBeforeResult = false
	| void
	| Blob
	| (Partial<Omit<UploadFile, 'target'>> & { target?: Blob });

/**
 * 文件失败发生的阶段。
 * preflight 只用于内部任务状态，不会对外派发 file-error。
 */
export type UploadErrorStage = 'preflight' | 'upload';

/**
 * Upload 组件与 Upload.open 共同使用的完整回调契约。
 * 每个回调只接收一个对象，事件类型由此接口自动派生。
 */
export interface UploadCallback {
	onMessage(payload: { cause: UploadError; message: string }): string | void | Promise<string | void>;
	onError(payload: { cause: UploadError }): void;
	onBegin(payload: { rawFiles: File[]; files: UploadFile[] }): void;
	// eslint-disable-next-line @stylistic/max-len
	onRequest(payload: { requestOptions: UploadRequestOptions; instance: ComponentInternalInstance }): UploadRequestOptions | void | Promise<UploadRequestOptions | void>;
	onResponse(payload: { request: XMLHttpRequest | undefined; requestOptions: UploadRequestOptions }): unknown | Promise<unknown>;
	onFileBefore(payload: { file: UploadFile; rawFiles: File[] }): UploadFileBeforeResult | Promise<UploadFileBeforeResult>;
	onFileStart(payload: { file: UploadFile }): void;
	onFileProgress(payload: { progress: UploadProgress; file: UploadFile }): void;
	onFileSuccess(payload: { response: unknown; file: UploadFile; result: UploadCycleResult }): void;
	onFileError(payload: { stage: UploadErrorStage; cause: unknown; message: string; file: UploadFile; result: UploadCycleResult }): void;
	onComplete(payload: { result: UploadCycleResult }): void;
}

type KebabCase<Value extends string> = Value extends `${infer Head}${infer Tail}`
	? Head extends Lowercase<Head>
		? `${Head}${KebabCase<Tail>}`
		: `-${Lowercase<Head>}${KebabCase<Tail>}`
	: Value;

type CallbackEventName<Value extends string> = Value extends `on${infer Name}`
	? KebabCase<Name> extends `-${infer EventName}`
		? EventName
		: never
	: never;

type CallbackPayload<Value> = Value extends (payload: infer Payload) => unknown
	? Payload
	: never;

/**
 * 由 UploadCallback 自动生成的事件名与对象参数映射。
 */
export type UploadEventMap = {
	[Key in keyof UploadCallback as CallbackEventName<Key & string>]: CallbackPayload<UploadCallback[Key]>;
};

/**
 * 保留事件名与 payload 关联的参数联合类型。
 */
export type UploadEventArgs<EventName extends keyof UploadEventMap = keyof UploadEventMap> = {
	[Key in EventName]: [eventName: Key, payload: UploadEventMap[Key]]
}[EventName];

/**
 * 原生选择器增强器，可以同步或异步决定是否跳过 input click。
 */
export type UploadEnhancer = (instance: ComponentInternalInstance) => boolean | void | Promise<boolean | void>;

/**
 * Upload 组件实例向模板 ref 与 Upload.open 暴露的操作。
 */
export interface UploadExposed {
	uploadFiles: (files: FileList | File[]) => void;
	click: () => void;
}
