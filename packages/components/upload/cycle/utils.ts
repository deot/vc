import type {
	UploadFile,
	UploadFileBeforeResult
} from '../types';

type ProcessedUploadFile = Required<Exclude<
	UploadFileBeforeResult,
	false | void | Blob
>>;

const isFiniteNumber = (value: unknown): value is number => {
	return typeof value === 'number' && Number.isFinite(value);
};

/**
 * 将 onFileBefore 返回的 Blob 补全为可以提交的具名 File。
 * @param blob - 需要转换的二进制内容。
 * @param name - 处理结果指定的文件名。
 * @param source - 提供修改时间的原始 File。
 * @returns 原 File 或新创建的 File。
 */
const toNamedFile = (blob: Blob, name: string, source: File) => {
	if (blob instanceof File) return blob;

	return new File([blob], name, {
		type: blob.type,
		lastModified: source.lastModified
	});
};

/**
 * 判断返回对象是否包含完整上传文件结构，以便在可扩展时保留对象引用。
 * @param value - onFileBefore 的对象返回值。
 * @returns 是否为 target 允许是 Blob 的完整上传文件。
 */
const isProcessedUploadFile = (value: object): value is ProcessedUploadFile => {
	const file = value as Partial<ProcessedUploadFile>;
	return typeof file.uploadId === 'string'
		&& isFiniteNumber(file.current)
		&& isFiniteNumber(file.total)
		&& isFiniteNumber(file.percent)
		&& isFiniteNumber(file.size)
		&& typeof file.name === 'string'
		&& file.target instanceof Blob;
};

/**
 * 收窄处理结果的 target，确保返回值满足 UploadFile。
 * @param value - 已通过完整结构检查的处理结果。
 * @returns target 是否已经是 File。
 */
const hasFileTarget = (
	value: ProcessedUploadFile
): value is ProcessedUploadFile & { target: File } => value.target instanceof File;

/**
 * 合并部分处理结果，并回退无效字段和恢复 Cycle 标识。
 * @param source - Hook 接收到的文件对象。
 * @param value - Hook 返回的部分文件信息。
 * @param original - Hook 调用前保存的源文件快照。
 * @returns 满足 UploadFile 不变量的新对象。
 */
const normalizeFileObject = (
	source: UploadFile,
	value: object,
	original: UploadFile
): UploadFile => {
	const result = { ...source, ...value };
	const name = typeof result.name === 'string' ? result.name : original.name;
	const candidateTarget = result.target instanceof Blob
		? result.target
		: original.target;
	const target = toNamedFile(candidateTarget, name, original.target);
	const targetChanged = candidateTarget !== original.target;

	return {
		...result,
		uploadId: original.uploadId,
		current: original.current,
		total: original.total,
		percent: isFiniteNumber(result.percent) ? result.percent : original.percent,
		size: targetChanged
			? target.size
			: isFiniteNumber(result.size)
				? result.size
				: target.size,
		name,
		target
	};
};

/**
 * 规范化 onFileBefore 的返回值，并始终保留 Cycle 创建的任务标识。
 * 完整且可扩展的对象会原地补全，其余对象通过浅合并生成新副本。
 * @param source - Cycle 创建的源上传文件。
 * @param processedFile - onFileBefore 的返回值。
 * @param original - onFileBefore 调用前保存的源文件快照。
 * @returns 可继续上传的文件；false 表示取消当前文件。
 */
export const normalizeProcessedFile = (
	source: UploadFile,
	processedFile: unknown,
	original: UploadFile
): UploadFile | false => {
	if (processedFile === false) return false;

	if (processedFile instanceof Blob) {
		return normalizeFileObject(source, { target: processedFile }, original);
	}

	const candidate = processedFile && typeof processedFile === 'object'
		? processedFile
		: source;
	if (isProcessedUploadFile(candidate) && Object.isExtensible(candidate)) {
		candidate.uploadId = original.uploadId;
		candidate.current = original.current;
		candidate.total = original.total;
		if (!hasFileTarget(candidate)) {
			const target = toNamedFile(candidate.target, candidate.name, original.target);
			candidate.target = target;
			candidate.size = target.size;
		}
		if (hasFileTarget(candidate)) {
			if (candidate.target !== original.target) {
				candidate.size = candidate.target.size;
			}
			return candidate;
		}
	}

	return normalizeFileObject(source, candidate, original);
};
