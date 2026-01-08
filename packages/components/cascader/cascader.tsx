/** @jsxImportSource vue */

import { defineComponent, ref, watch, computed, nextTick, inject } from 'vue';
import { isEqualWith } from 'lodash-es';
import { useAttrs } from '@deot/vc-hooks';
import { scrollIntoView } from '@deot/helper-dom';
import { getSelectedData } from './utils';
import { VcError } from '../vc/index';
import { Input } from '../input/index';
import { Popover } from '../popover/index';
import { Icon } from '../icon/index';
import { CascaderColumn } from './column';

import { toCurrentValue, toModelValue } from '../select/utils';

import type { TreeData, TreeValue, TreeLabel } from '../select/utils';
import type { FormItemProvide } from '../form/types';
import type { CellChangeOptions } from './types';
import { props as cascaderProps } from './cascader-props';

const COMPONENT_NAME = 'vc-cascader';

export const Cascader = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: cascaderProps,
	emits: ['update:modelValue', 'visible-change', 'ready', 'change', 'close'],
	setup(props, { emit, slots }) {
		const formItem = inject('vc-form-item', {} as FormItemProvide);
		const its = useAttrs({ merge: false });

		const isHover = ref(false);
		const isActive = ref(false);
		const currentValue = ref<TreeValue[]>([]);
		const rebuildData = ref<TreeData[]>([]);
		const colRef = ref({});

		const icon = computed(() => {
			return isActive.value ? 'up' : 'down';
		});

		const showClear = computed(() => {
			return currentValue.value && currentValue.value.length && props.clearable && !props.disabled && isHover.value;
		});

		const columns = computed(() => {
			return Array.from({ length: currentValue.value.length + 1 }).map((_, index) => index);
		});
		/**
		 * TODO: 初始化时，存在查找耗时
		 */
		const currentLabel = computed(() => {
			const { label: $label } = getSelectedData(
				props.changeOnSelect
					? currentValue.value
					: toCurrentValue(
							props.modelValue,
							{
								numerable: props.numerable,
								separator: props.separator
							}
						),
				props.data
			) || {};
			return ($label || []).filter(i => i) as TreeLabel[];
		});

		const formatLabel = computed(() => {
			return props.format(currentLabel.value) || props.extra;
		});

		const setColRef = (el: HTMLElement, index: number) => {
			el && (colRef[index] = el);
		};

		/**
		 * v-model 同步, 外部的数据改变时不会触发
		 * @param force ~
		 */
		const sync = (force?: boolean) => {
			const value = toModelValue(
				currentValue.value,
				{
					modelValue: props.modelValue,
					max: props.max,
					numerable: props.numerable,
					separator: props.separator,
					nullValue: props.nullValue
				}
			);
			(props.changeOnSelect) && (
				emit('update:modelValue', value, currentLabel.value),
				emit('change', value, currentLabel.value)
			);

			// 最后一项，自动关闭
			const lastData = rebuildData.value[currentValue.value.length];

			const isLast = !lastData || lastData.length === 0;

			(isLast || props.changeOnSelect) && (isActive.value = false);

			// 该模式下，label会变为上一个值，这里重新获取一次
			if ((force || isLast) && !props.changeOnSelect) {
				const { label: $label } = getSelectedData(currentValue.value, props.data) || {};

				emit('update:modelValue', value, $label);
				emit('change', value, $label);
			}

			formItem.change?.();
		};

		/**
		 * 单列数据
		 * @param source 数据源
		 * @returns ~
		 */
		const makeData = (source: TreeData[]): TreeData[] => {
			const data = source && source.map(i => ({
				value: i.value,
				label: i.label,
				hasChildren: !!(i.children && (i.children.length > 0 || props.loadData)),
				loading: false
			}));
			return data;
		};

		/**
		 * 调整数据
		 * @returns 每列的数据
		 */
		const makeRebuildData = (): TreeData[] => {
			if (!props.data.length) return [] as TreeData[];
			let temp: TreeData[] = props.data;
			const data = currentValue.value.slice(0).reduce((pre, cur, index) => {
				pre[index] = temp && makeData(temp);
				temp = ((temp && temp.find(i => i.value == cur)) || {}).children || [];
				return pre;
			}, [] as TreeData[]);

			temp && data.push(makeData(temp));

			return data;
		};

		/**
		 * 初始化完成后格式化数据
		 */
		const handleReady = () => {
			rebuildData.value = makeRebuildData();

			emit('ready');

			/**
			 * 滚动到初始位置
			 * TODO: 是否移入col单独处理
			 */

			nextTick(() => {
				currentValue.value.forEach((item, index) => {
					const el = colRef.value[index] && colRef.value[index].$el;
					const source = rebuildData.value[index];

					if (source && el) {
						const $instance = source.findIndex((i: TreeData) => item == i.value);
						scrollIntoView(el.firstChild, { to: $instance * 30 });
					}
				});
			});
		};

		const handleClear = (e: Event) => {
			if (!showClear.value) return;
			e.stopPropagation();

			currentValue.value.splice(0, currentValue.value.length);
			isActive.value = false;

			sync(true);
		};

		/**
		 * 改变后的回调
		 * @param options 改变后的值
		 */
		const handleCellChange = async (options: CellChangeOptions) => {
			const { value, rowIndex, columnIndex } = options || {};
			try {
				const len = currentValue.value.slice(columnIndex).length;
				currentValue.value.splice(columnIndex, len, value);

				/**
				 * TODO: 提前缓存index
				 */
				const children = currentValue.value.reduce((pre: TreeData[] | undefined, cur) => {
					const target = (pre && pre.find((i: TreeData) => i.value == cur)) || {};

					return target.children ? target.children : undefined;
				}, props.data);

				/**
				 * 异步加载数据
				 */
				if (props.loadData && children && children.length === 0) {
					rebuildData.value[columnIndex][rowIndex].loading = true;

					const res = await props.loadData();
					/**
					 * TODO: 优化，data -> cloneData?
					 */
					children.splice(0, 0, ...res);
				}

				children && rebuildData.value.splice(columnIndex + 1, len, makeData(children));

				// 清理
				if ((!children || children.length === 0) && columnIndex < rebuildData.value.length) {
					currentValue.value.splice(columnIndex + 1, len);
					rebuildData.value.splice(columnIndex + 1, len);
				}
			} catch (e) {
				throw new VcError('vc-cascader', e);
			} finally {
				rebuildData.value[columnIndex][rowIndex].loading && (
					rebuildData.value[columnIndex][rowIndex].loading = false
				);
			}
		};

		const handleCellClick = () => {
			sync();
		};

		/**
		 * 在关闭的时候，让重新打开的值一致
		 * 暂时不用rebuildData.value, ready时会再次触发
		 */
		const handleClose = () => {
			const v = toCurrentValue(props.modelValue, {
				numerable: props.numerable,
				separator: props.separator
			});
			if (!isEqualWith(currentValue.value, v)) {
				currentValue.value = [...v];
			}

			emit('close');
		};

		// 可能存在强制关闭的情况
		const handleDestroy = () => {
			isActive.value && (isActive.value = false);
		};

		watch(
			() => props.data,
			() => {
				rebuildData.value = makeRebuildData();
			}
		);

		watch(
			() => props.modelValue,
			(v) => {
				v = toCurrentValue(v, {
					numerable: props.numerable,
					separator: props.separator
				});
				// 不使用currentValue.value = v; 避免同步修改源数据，这里有取消操作
				currentValue.value = v && v.length > 0 ? [...v] : [];
			},
			{ immediate: true }
		);
		return () => {
			return (
				<Popover
					modelValue={isActive.value}
					{
						...its.value.attrs
					}
					arrow={props.arrow}
					trigger={props.trigger}
					tag={props.tag}
					placement={props.placement}
					auto-width={props.autoWidth}
					disabled={props.disabled}
					portalClass={[['is-padding-none', props.portalClass]]}
					class={[its.value.class, 'vc-cascader']}
					style={its.value.style}
					animation="y"
					// @ts-ignore
					onMouseenter={() => (isHover.value = true)}
					onMuseleave={() => (isHover.value = false)}
					onReady={handleReady}
					onClose={handleClose}
					onDestroy={handleDestroy}
					onVisibleChange={() => emit('visible-change', isActive.value)}
					onUpdate:modelValue={(v: boolean) => (isActive.value = v)}
				>
					{{
						default: () => {
							if (slots.default) {
								return slots.default({
									label: currentLabel.value,
									value: currentValue.value,
									active: isActive.value
								});
							}
							return (
								<Input
									id={props.id}
									disabled={props.disabled}
									modelValue={formatLabel.value}
									allow-dispatch={false}
									class="vc-cascader__input"
									// @ts-ignore
									readonly={true}
									placeholder={its.value.attrs?.placeholder || '请选择'}
								>
									{{
										append: () => {
											return (
												<div class="vc-cascader__append">
													<Icon
														type={showClear.value ? 'clear' : icon.value}
														class={[{ 'is-arrow': !showClear }, 'vc-cascader__icon']}
														// @ts-ignore
														onClick={handleClear}
													/>
												</div>
											);
										}
									}}
								</Input>
							);
						},
						content: () => {
							return (
								<div class="vc-cascader__content">
									{
										columns.value.map((_, index) => {
											if (!rebuildData.value[index] || !rebuildData.value[index].length) return;
											return (
												<CascaderColumn
													ref={(el: any) => setColRef(el, index)}
													key={index}
													index={index}
													value={currentValue.value[index]}
													data={rebuildData.value[index] as any}
													onChange={handleCellChange}
													onClick={handleCellClick}
												/>
											);
										})
									}
								</div>
							);
						}
					}}
				</Popover>
			);
		};
	}
});
