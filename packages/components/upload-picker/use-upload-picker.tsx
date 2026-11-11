/** @jsxImportSource vue */

import { getCurrentInstance, toRaw } from 'vue';
import type { SetupContext } from 'vue';
import { useLocale } from '../locale';
import { VcInstance } from '../vc';
import { Icon } from '../icon/index';
import { renderFileItem, renderFileItems } from '../file-preview/item';
import type { FileItemKind } from '../file-preview/item';
import type { UploadEventMap } from '../upload/types';
import type { Props } from './upload-picker-props';
import { usePicker } from './use-picker';
import type { Emits } from './use-picker';
import { PICKER_ITEM_KEY, getRowState, resolveEnhancer } from './utils';
import type { PickerItem, PickerType } from './types';

export interface UploadPickerOptions {
	// 移动端（MUploadPicker）：根节点加标记类 vcm-upload-picker、vcm-file-items，尺寸按 750 稿覆盖；预览打开移动端查看器
	mobile?: boolean;
	// 各端的 Upload、SortList
	Upload: any;
	SortList: any;
	/**
	 * 有多种类型时，先选类型再打开该类型的原生选择（移动端）；不传时入口是一个接受所有类型的 Upload，选好后按类型分发（桌面端）
	 * 选中后须在同一次点按里调用 pick，原生选择才能打开
	 */
	choose?: (types: PickerType[], pick: (type: PickerType) => void) => void;
}

type RowState = ReturnType<typeof getRowState>;

/**
 * UploadPicker 与 MUploadPicker 共用的渲染：一个有序列表，唯一的上传入口，list / grid / group 三种布局
 * 每种类型仍各有一个隐藏的 Upload（按类型的 accept、max、uploadOptions 不变），入口选好的文件交给它们上传
 * @param props ~
 * @param context ~
 * @param options ~
 * @returns render
 */
export const useUploadPicker = (props: Props, context: SetupContext<Emits>, options: UploadPickerOptions) => {
	const { slots, emit } = context;
	const { t } = useLocale();
	const instance = getCurrentInstance()!;
	const base = usePicker(props, context, { mobile: options.mobile });
	const name = options.mobile ? 'vc-upload-picker vcm-upload-picker vcm-file-items' : 'vc-upload-picker';
	const { Upload, SortList } = options;

	// UploadPicker 的 enhancer：返回真值表示已自行处理，不再打开原生选择
	const enhance = (type?: PickerType) => {
		const enhancer = resolveEnhancer(props.enhancer, VcInstance.options.UploadPicker?.enhancer);
		return !!enhancer?.({ instance, type, types: base.types.value });
	};
	const pick = (type: PickerType) => {
		enhance(type) || base.pick(type);
	};
	// 只剩一种类型时就是这一种；桌面端多种类型一次选择时为空
	const entryType = () => {
		const types = base.available.value;
		return types.length === 1 ? types[0] : undefined;
	};

	// 移动端入口：只剩一种类型时直接打开，否则先选类型
	const handleChoose = () => {
		const type = entryType();
		type ? pick(type) : options.choose!(base.available.value, pick);
	};

	// 桌面端入口在 Upload 里：enhancer 接管时不再冒泡到 Upload（不打开选择框）
	const handleEntryClick = (e: MouseEvent) => {
		enhance(entryType()) && e.stopPropagation();
	};

	// 桌面端入口自己的校验（都不支持、超出数量）：同各类型 Upload 的 error，多种类型一次选择时 type 为空
	const handleEntryError = (payload: UploadEventMap['error']) => {
		emit('error', { ...payload, type: entryType() });
	};

	// 进度条按比例缩放（只走合成，不触发布局）
	const renderBar = (percent: number) => (
		<span class="vc-upload-picker__bar" style={{ transform: `scaleX(${percent / 100})` }} />
	);

	// 失败为「上传失败」与「重试」；上传中整行为右侧百分比，方格为覆盖层上的百分比与带轨道的细进度条；传完等待响应时为「服务器正在接收...」
	const renderState = (row: PickerItem, state: RowState, kind: FileItemKind) => {
		const { isError, isDone, percent } = state;
		if (isError) {
			return (
				<span class={['vc-upload-picker__failed', { 'vc-upload-picker__overlay': kind === 'tile' }]}>
					<span>{t('vc.UploadPicker.failed')}</span>
					{
						base.isRetryable(row) && (
							<button
								type="button"
								class="vc-upload-picker__retry"
								onClick={(e: MouseEvent) => {
									e.stopPropagation();
									base.handleRetry(row);
								}}
							>
								{t('vc.UploadPicker.retry')}
							</button>
						)
					}
				</span>
			);
		}
		if (isDone) return null;
		const text = percent >= 100
			? <span class="vc-upload-picker__receiving">{t('vc.UploadPicker.receiving')}</span>
			: <span class="vc-upload-picker__percent">{`${percent}%`}</span>;
		if (kind === 'row') return text;
		return (
			<span class="vc-upload-picker__overlay vc-upload-picker__state">
				{text}
				<span class="vc-upload-picker__meter">{renderBar(percent)}</span>
			</span>
		);
	};

	const renderItem = (row: PickerItem, kind: FileItemKind) => {
		const state = getRowState(row, props.keyValue);
		const { label, isError, isDone } = state;
		const isLoading = !isError && !isDone;
		const key = row[PICKER_ITEM_KEY];
		const classes = ['vc-upload-picker__item', { 'is-error': isError, 'is-loading': isLoading }];

		if (slots.default) {
			const { position, preview } = base.indexes.value;
			return (
				<div key={key} class={[classes, `is-${row.type}`]}>
					{
						slots.default({
							row,
							type: row.type,
							// 预览中的位置（过滤上传失败、未完成的项）；不能预览时为 -1
							index: preview.get(toRaw(row)) ?? -1,
							// 在列表中的位置
							position: position.get(toRaw(row))
						})
					}
				</div>
			);
		}

		return renderFileItem(
			{
				type: row.type,
				source: isDone ? row[props.keyValue.value] : undefined,
				name: label
			},
			kind,
			{
				key,
				title: label,
				class: classes,
				onClick: isDone ? () => base.handlePreview(row) : undefined,
				extra: renderState(row, state, kind),
				action: (!props.disabled || isError) && (
					<Icon
						type={options.mobile ? 'close' : 'close-small'}
						class="vc-upload-picker__delete"
						// @ts-ignore
						onClick={(e: MouseEvent) => {
							e.stopPropagation();
							base.handleRemove(row);
						}}
					/>
				),
				progress: kind === 'row' && isLoading && renderBar(state.percent)
			}
		);
	};

	// 排序列表的插槽：方格、整行各一个，$stable 让父组件更新时不强制更新 SortList
	const renderSortTile = ({ row }: { row: PickerItem }) => renderItem(row, 'tile');
	const renderSortRow = ({ row }: { row: PickerItem }) => renderItem(row, 'row');

	// 一块里的项；可排序时每块各自排序：group 的方格、整行分别在块内换位，输出顺序按整个列表
	const renderBlock = (items: PickerItem[], kind: FileItemKind) => {
		if (!props.sortable) return items.map(row => renderItem(row, kind));
		return (
			<SortList
				modelValue={items}
				primaryKey={PICKER_ITEM_KEY}
				mask={props.mask}
				class="vc-upload-picker__sort"
				onChange={base.handleSortChange}
			>
				{{ default: kind === 'tile' ? renderSortTile : renderSortRow, $stable: true }}
			</SortList>
		);
	};

	/**
	 * 上传入口：grid 为列表末尾的添加方格，list、group 为列表上方的按钮；upload 插槽替换入口
	 * 桌面端放在一个 Upload 里（accept 为还能上传的类型的并集，可拖入文件），选好后按类型分发；移动端点击后先选类型
	 * @param kind 添加方格或按钮
	 * @returns VNode
	 */
	const renderEntry = (kind: 'tile' | 'button') => {
		if (!base.canUpload.value) return null;
		const onClick = options.choose ? handleChoose : handleEntryClick;
		const content = slots.upload
			? <div key="entry" class="vc-upload-picker__custom" onClick={onClick}>{slots.upload({ types: base.types.value })}</div>
			: kind === 'tile'
				? (
						<div key="entry" class={[props.boxClass, 'vc-upload-picker__box']} onClick={onClick}>
							<Icon type="mini-plus" class="vc-upload-picker__plus-icon" />
							<span class="vc-upload-picker__box-text">{t('vc.UploadPicker.upload')}</span>
						</div>
					)
				: (
						<button key="entry" type="button" class={[props.boxClass, 'vc-upload-picker__trigger']} onClick={onClick}>
							<Icon type="upload" class="vc-upload-picker__trigger-icon" />
							<span>{t('vc.UploadPicker.upload')}</span>
						</button>
					);
		if (options.choose) return content;
		// 只剩一种类型时沿用该类型 Upload 的属性（enhancer、size、directory、onMessage 等）
		const type = entryType();
		const { accept, max } = base.entry.value;
		return (
			<Upload
				key="entry"
				tag="div"
				class="vc-upload-picker__upload"
				{...(type ? base.uploadOptions.value[type] : { showError: props.showError })}
				accept={accept}
				max={max}
				distribute={base.distribute}
				onError={handleEntryError}
			>
				{content}
			</Upload>
		);
	};

	// 每种类型一个隐藏的 Upload：不渲染入口，只负责上传与校验；属性、事件不变时不随父组件更新
	const renderUploaders = () => base.types.value.map(type => (
		<Upload
			key={type}
			class="vc-upload-picker__uploader"
			{...base.uploadOptions.value[type]}
			{...base.listenersOf(type)}
			max={base.remaining.value[type]}
			disabled={props.disabled}
			ref={base.setUploader(type)}
		/>
	));

	return () => {
		const layout = base.layout.value;
		const { media, others } = base.sections.value;
		return renderFileItems({
			class: [name, { 'is-disabled': props.disabled }],
			layout,
			tileSize: props.size || 'small',
			rowSize: props.size || 'medium',
			items: base.currentValue.value,
			media,
			others,
			block: renderBlock,
			head: layout === 'grid' ? null : renderEntry('button'),
			tail: layout === 'grid' ? renderEntry('tile') : null,
			extra: renderUploaders()
		});
	};
};
