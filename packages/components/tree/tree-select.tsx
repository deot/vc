/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, inject, ref, computed, watch } from 'vue';
import { debounce, isEqualWith } from 'lodash-es';
import { useAttrs } from '@deot/vc-hooks';
import { getUid } from '@deot/helper-utils';
import { createSearchRegex, flattenData, toCurrentValue, toModelValue } from '../select/utils';
import type { TreeData } from '../select/utils';
import { VcError } from '../vc/index';
import { Input, InputSearch } from '../input/index';
import { Popover } from '../popover/index';
import { Spin } from '../spin/index';
import { Icon } from '../icon/index';
import { SelectTags } from '../select/select-tags';
import { TreeSelectContent } from './tree-select-content';
import { TreeSelectContentCascader } from './tree-select-content-cascader';
import { props as treeSelectProps } from './tree-select-props';

const COMPONENT_NAME = 'vc-tree-select';

export const TreeSelect = defineComponent({
	name: COMPONENT_NAME,
	props: treeSelectProps,
	emits: ['ready', 'close', 'visible-change', 'clear', 'change', 'update:modelValue'],
	setup(props, { emit, expose }) {
		const instance = getCurrentInstance();
		const its = useAttrs({ merge: false });
		const formItem = inject<any>('vc-form-item', {});
		const treeSelectId = ref(getUid('tree-select'));

		const isHover = ref(false);
		const isActive = ref(false);
		const isLoading = ref(false);
		const searchValue = ref('');
		const searchRegex = computed(() => createSearchRegex(searchValue.value));
		const currentValue = ref<Array<string | number>>([]);

		const currentValueGroups = computed(() => {
			if (props.checkStrictly) return;
			if (!props.data?.length || !Array.isArray(currentValue.value) || !currentValue.value.length) {
				return [];
			}
			const pathMap = new Map<string | number, (string | number)[]>();
			const traverse = (data: TreeData[], path: (string | number)[] = []) => {
				data.forEach((item) => {
					const v = item.value;
					if (v == null) return;
					const fullPath = [...path, v];
					pathMap.set(v, fullPath);
					if (item.children?.length) traverse(item.children, fullPath);
				});
			};
			traverse(props.data as TreeData[]);

			const allPaths = currentValue.value.map(v => pathMap.get(v)).filter(Boolean) as (string | number)[][];

			return allPaths.filter(path =>
				!allPaths.some(other =>
					other !== path
					&& other.length > path.length
					&& path.every((v, i) => v === other[i])
				)
			);
		});

		const source = computed(() => {
			return flattenData(props.data, { parent: true, cascader: true });
		});

		const labelMap = computed(() => {
			return source.value.reduce((pre, cur) => {
				pre[cur.value] = cur.label || '';
				return pre;
			}, {});
		});

		const icon = computed(() => {
			return isActive.value ? 'up' : 'down';
		});

		const multiple = computed(() => {
			return props.max > 1;
		});

		const showClear = computed(() => {
			const value = currentValue.value.length > 0;
			const basic = props.clearable && !props.disabled && isHover.value;
			return (typeof value === 'number' || value) && basic;
		});

		const classes = computed(() => {
			return {
				'is-disabled': props.disabled
			};
		});

		const displayTags = computed(() => {
			if (!props.data.length) {
				return [];
			}
			if (props.checkStrictly) {
				return currentValue.value.map((v: any) => ({
					value: v,
					label: labelMap.value[v] || ''
				}));
			}

			return (currentValueGroups.value || []).map((path) => {
				const value = path[path.length - 1];
				const label = path.map(v => labelMap.value[v] || '').filter(Boolean).join(' / ');
				return {
					path,
					value,
					label
				};
			});
		});

		const tags = computed(() => {
			return displayTags.value.map((item: any) => ({
				...item,
				// 值本身可能含分隔符，用 JSON 避免不同路径拼出相同的 key
				key: item.path ? JSON.stringify(item.path) : item.value
			}));
		});

		const autoWidth = computed(() => {
			return typeof props.autoWidth === 'boolean' ? props.autoWidth : !!props.cascader;
		});

		/**
		 * v-model 同步, 外部的数据改变时不会触发
		 */
		const sync = () => {
			const v = toModelValue(currentValue.value, {
				modelValue: props.modelValue,
				max: props.max,
				numerable: props.numerable,
				separator: props.separator,
				nullValue: props.nullValue
			});

			const labels = displayTags.value.map(item => item.label);

			emit('update:modelValue', v, labels);
			emit('change', v, labels);

			// form表单
			formItem?.change?.(currentValue.value);
		};

		/**
		 * 默认防抖
		 */
		const _loadData = debounce(function () {
			const remote = props.loadData?.(searchValue.value, instance);

			if (remote && remote.then) {
				isLoading.value = true;
				remote.finally(() => {
					isLoading.value = false;
				});
			} else {
				throw new VcError('tree-select', 'loadData 返回值需要Promise');
			}
		}, 250, { leading: false });

		const close = () => {
			isActive.value = false;
		};

		const handleClose = (item: { value: string | number; path?: (string | number)[] }) => {
			if (props.checkStrictly) {
				const index = currentValue.value.findIndex(v => v === item.value);
				if (index === -1) return;
				currentValue.value = currentValue.value.filter((_, i) => i !== index);
			} else if (item.path) {
				const remaining = (currentValueGroups.value || []).filter(
					p => !(p.length === item.path!.length && p.every((v, i) => v === item.path![i]))
				);
				currentValue.value = [...new Set(remaining.flat())];
			}
			sync();
		};

		const handleClear = (e) => {
			if (!showClear.value) return;
			e.stopPropagation();

			emit('clear');

			currentValue.value = [];
			isActive.value = false;

			sync();
		};

		const handleSearch = (v) => {
			searchValue.value = v;
			props.loadData && _loadData();
		};

		const handleChange = (_: any, data: any) => {
			currentValue.value = data.checkedValues;

			sync();
		};

		// 关闭时（点击外部 / 清空 / close / toggle）重置搜索，下次打开恢复完整视图
		watch(isActive, (v) => {
			!v && searchValue.value && handleSearch('');
		});

		watch(
			() => props.modelValue,
			(v) => {
				v = toCurrentValue(v, {
					numerable: props.numerable,
					separator: props.separator
				});
				if (isEqualWith(v, currentValue.value)) return;

				currentValue.value = v;
			},
			{ immediate: true }
		);

		expose({
			treeSelectId,
			close,
			searchRegex,
			multiple,
			isActive,
			current: currentValue,
			currentValueGroups,
			// for portal
			toggle(v?: boolean) {
				v = typeof v === 'boolean' ? v : !isActive.value;
				isActive.value = v;
			}
		});
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
					autoWidth={autoWidth.value}
					disabled={props.disabled}
					portal={props.portal}
					portalClass={[['is-padding-none', props.portalClass]]}
					class={[classes.value, its.value.class, 'vc-tree-select']}
					style={its.value.style}
					animation="y"
					// @ts-ignore
					onMouseenter={() => (isHover.value = true)}
					onMouseleave={() => (isHover.value = false)}
					onReady={() => emit('ready')}
					onClose={() => emit('close')}
					onVisibleChange={() => emit('visible-change', isActive.value)}
					onUpdate:modelValue={(v: boolean) => (isActive.value = v)}
				>
					{{
						default: () => {
							return (
								<Input
									id={props.id}
									disabled={props.disabled}
									modelValue={displayTags.value[0]?.label || props.extra}
									allow-dispatch={false}
									class="vc-tree-select__input"
									// @ts-ignore
									readonly={true}
									placeholder={its.value.attrs?.placeholder || '请选择'}
								>
									{{
										content: multiple.value && displayTags.value.length > 0
											? () => {
													return (
														<SelectTags
															class={[classes.value, 'vc-tree-select__tags']}
															data={tags.value}
															maxTags={props.maxTags}
															maxTagLines={props.maxTagLines}
															closable={!props.disabled}
															onClose={(item: any) => handleClose(item)}
														/>
													);
												}
											: null,
										append: () => {
											return (
												<div class="vc-tree-select__append">
													<Icon
														type={showClear.value ? 'clear' : icon.value}
														class={[{ 'is-arrow': !showClear.value }, 'vc-tree-select__icon']}
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
								<div class="vc-tree-select__content">
									{
										props.searchable && (
											<div class="vc-tree-select__search">
												<InputSearch
													class="vc-tree-select__search-input"
													modelValue={searchValue.value}
													// @ts-ignore
													placeholder={props.searchPlaceholder}
													onInput={handleSearch}
												/>
											</div>
										)
									}
									{
										isLoading.value && (
											<div class="vc-tree-select__loading">
												<Spin size={16} />
											</div>
										)
									}
									{
										props.cascader
											? (
													<TreeSelectContentCascader
														value={currentValue.value}
														data={props.data as TreeData[]}
														checkStrictly={props.checkStrictly}
														renderNodeLabel={props.renderNodeLabel}
														numerable={props.numerable}
														separator={props.separator}
														max={props.max}
														nullValue={props.nullValue as never}
														searchValue={searchValue.value}
														searchRegex={searchRegex.value}
														remote={!!props.loadData}
														onChange={handleChange}
													/>
												)
											: (
													<TreeSelectContent
														value={currentValue.value}
														data={props.data}
														checkStrictly={props.checkStrictly}
														renderNodeLabel={props.renderNodeLabel}
														searchValue={searchValue.value}
														searchRegex={searchRegex.value}
														remote={!!props.loadData}
														onChange={handleChange}
													/>
												)
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
