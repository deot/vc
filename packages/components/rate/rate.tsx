/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch, inject } from 'vue';
import * as DOM from '@deot/helper-dom';
import { Utils as VcUtils } from '@deot/vc-shared';
import { props as rateProps } from './rate-props';
import { Icon } from '../icon';

const COMPONENT_NAME = 'vc-rate';

export const Rate = defineComponent({
	name: COMPONENT_NAME,
	props: rateProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots, emit }) {
		const formItem = inject<any>('vc-form-item', {});
		const currentValue = ref(0);
		const hoverValue = ref(-1);
		const isHover = ref(false);
		const dataSource = ref<any[]>([]);

		const config = computed(() => {
			return {
				count: props.count,
				value: isHover.value ? hoverValue.value : currentValue.value
			};
		});

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = +v;
			},
			{ immediate: true }
		);

		watch(
			() => config.value,
			(obj) => {
				const { count, value } = obj;
				const array = [...Array(count).keys()].map(v => v + 1);
				dataSource.value = array.map((v) => {
					// 0 < xx < 1 0.8也算一半
					const isHalf = props.half && v > value && (v - 1) < value;
					const isFull = v === value;
					const isSelect = v <= value;
					return {
						value: v,
						isSelect,
						isFull,
						isHalf,
						color: isSelect || isHalf ? props.color : ''
					};
				});
			},
			{ immediate: true }
		);

		const sync = () => {
			const v = typeof props.modelValue === 'string' ? String(currentValue.value) : currentValue.value;
			emit('update:modelValue', v);
			emit('change', v);
		};

		const getClickSide = (e) => {
			const path = e.path || DOM.composedPath(e) || [];
			const isLeftSide = path.some((item: any) => VcUtils.eleInRegExp(item, { className: /vc-rate__star--first/ }));
			const isRightSide = path.some((item: any) => VcUtils.eleInRegExp(item, { className: /vc-rate__star--second/ }));
			if (isLeftSide) return 'left';
			if (isRightSide) return 'right';
			return false;
		};

		const getValue = (e, $currentValue: any, item: any, clearable: any) => {
			const { value, isHalf, isFull } = item;
			const clickSide = props.half && getClickSide(e);
			if (!clearable) {
				if (clickSide === 'left') {
					return value - 0.5;
				} else if (clickSide === 'right') {
					return value;
				} else { // half为false
					return value;
				}
			} else if (clearable) {
				if (clickSide === 'left') {
					let offset = 0.5;
					if (isHalf) return 0;
					else if (isFull) offset = 0.5;
					return value - offset;
				} else if (clickSide === 'right') {
					if (isFull) return 0;
					return value;
				} else { // half为false
					return $currentValue == value ? 0 : value;
				}
			}
		};

		const handleMouseMove = (e: any, item: any) => {
			if (props.disabled) return;

			hoverValue.value = getValue(e, hoverValue.value, item, false);
			isHover.value = true;
		};

		const handleMouseleave = () => {
			if (props.disabled) return;
			isHover.value = false;
			hoverValue.value = -1;
		};

		const handleClick = (e: any, item: any) => {
			if (props.disabled) return;

			isHover.value = false;
			item.isHalf = props.half && item.value > currentValue.value && (item.value - 1) < currentValue.value;
			item.isFull = currentValue.value == item.value;

			currentValue.value = getValue(e, currentValue.value, item, props.clearable);
			sync();
			formItem.change?.(currentValue.value);
		};
		return () => {
			return (
				<ul class="vc-rate" onMouseleave={handleMouseleave}>
					{
						dataSource.value.map((item: any, index: number) => {
							return (
								<li
									key={index}
									class={[
										{
											'is-not-last': index < props.count - 1,
											'is-disabled': props.disabled,
											'is-half': item.isHalf,
											'is-select': item.isSelect
										},
										'vc-rate__star'
									]}
									style={[props.iconStyle, { color: item.color }]}
									onClick={e => handleClick(e, item)}
									onMousemove={e => handleMouseMove(e, item)}
								>
									<div class="vc-rate__star--icon vc-rate__star--first">
										{
											props.character
												? (<span>{props.character}</span>)
												: (<Icon type={props.icon} />)
										}
									</div>
									<div class="vc-rate__star--icon vc-rate__star--second">
										{
											props.character
												? (<span>{props.character}</span>)
												: (<Icon type={props.icon} />)
										}
									</div>
								</li>
							);
						})
					}
					{
						!!props.tooltip.length && (
							<li class="vc-rate__tips">
								{
									slots.tip
										? slots.tip({ value: currentValue.value })
										: props.tooltip[Math.ceil(currentValue.value) - 1]
								}
							</li>
						)
					}
				</ul>
			);
		};
	}
});
