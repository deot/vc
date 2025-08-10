/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, inject, ref, computed, watch } from 'vue';
import { debounce, isEqualWith } from 'lodash-es';
import { useAttrs } from '@deot/vc-hooks';
import { getUid } from '@deot/helper-utils';
import { getLabel, escapeString, flattenData, toCurrentValue, toModelValue } from '../select/utils';
import { VcError } from '../vc/index';
import { Input, InputSearch } from '../input/index';
import { Popover } from '../popover/index';
import { Spin } from '../spin/index';
import { Tag } from '../tag/index';
import { Scroller } from '../scroller/index';
import { Icon } from '../icon/index';
import { Tree } from './tree';
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
		const searchRegex = ref(new RegExp(''));
		const currentValue = ref<Array<string | number>>([]);

		const source = computed(() => {
			return flattenData(props.data, { parent: true, cascader: true });
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

		const currentLabel = computed(() => {
			if (!props.data.length) {
				return [];
			}

			return currentValue.value.map(getLabel.bind(null, source.value));
		});

		const collapseTagCount = computed(() => {
			if (!props.maxTags) return 0;
			const v = currentValue.value.length - props.maxTags;
			return v < 0 ? 0 : v;
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

			emit('update:modelValue', v, currentLabel.value);
			emit('change', v, currentLabel.value);

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

		const handleClose = (index: number) => {
			currentValue.value.splice(index, 1);
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

			searchRegex.value = new RegExp(escapeString(v.trim()), 'i');
			props.loadData && _loadData();
		};

		const handleChange = (_: any, data: any) => {
			currentValue.value = data.checkedValues;

			sync();
		};

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
					auto-width={props.autoWidth}
					disabled={props.disabled}
					portalClass={[['is-padding-none', props.portalClass]]}
					class={[classes.value, its.value.class, 'vc-tree-select']}
					style={its.value.style}
					animation="y"
					// @ts-ignore
					onMouseenter={() => (isHover.value = true)}
					onMuseleave={() => (isHover.value = false)}
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
									modelValue={currentLabel.value[0] || props.extra}
									allow-dispatch={false}
									class="vc-tree-select__input"
									// @ts-ignore
									readonly={true}
									placeholder={its.value.attrs?.placeholder || '请选择'}
								>
									{{
										content: multiple.value && (currentValue.value && currentValue.value.length > 0)
											? () => {
													return (
														<div class={[classes.value, 'vc-tree-select__tags']}>
															{
																currentValue.value.slice(0, props.maxTags).map((item: any, index: number) => {
																	return (
																		<Tag
																			key={item}
																			closable={!props.disabled}
																			onClose={() => handleClose(index)}
																		>
																			{ currentLabel.value[index] || '' }
																		</Tag>
																	);
																})
															}
															{ collapseTagCount.value ? (<Tag>{ `+${collapseTagCount.value}...` }</Tag>) : null }
														</div>
													);
												}
											: null,
										append: () => {
											return (
												<div class="vc-tree-select__append">
													<Icon
														type={showClear.value ? 'clear' : icon.value}
														class={[{ 'is-arrow': !showClear }, 'vc-tree-select__icon']}
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
									<Scroller class="vc-tree-select__options" max-height="400px">
										<Tree
											model-value={currentValue.value}
											expanded-values={currentValue.value}
											data={props.data}
											checkStrictly={props.checkStrictly}
											allowDispatch={false}
											showCheckbox={true}
											onChange={handleChange}
										/>
									</Scroller>
								</div>
							);
						}
					}}
				</Popover>
			);
		};
	}
});
