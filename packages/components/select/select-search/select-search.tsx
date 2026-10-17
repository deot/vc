/** @jsxImportSource vue */

import { defineComponent, ref, nextTick, onMounted } from 'vue';
import { InputSearch } from '../../input/index';

const COMPONENT_NAME = 'vc-select-search';

/**
 * Select / TreeSelect / Cascader 弹层顶部的搜索栏；默认插槽在输入框之后（如全选）
 */
export const SelectSearch = defineComponent({
	name: COMPONENT_NAME,
	props: {
		modelValue: {
			type: String,
			default: ''
		},
		placeholder: String,
		// 是否显示输入框；内联搜索时只承载默认插槽
		input: {
			type: Boolean,
			default: true
		}
	},
	emits: ['search'],
	setup(props, { emit, slots }) {
		const input = ref<any>();

		const handleSearch = (v: string) => {
			emit('search', v);
		};

		// 打开即可输入；弹层此时尚未显示和定位，等其渲染后再聚焦，且不滚动页面
		onMounted(() => {
			nextTick(() => input.value?.focus({ preventScroll: true }));
		});

		return () => {
			return (
				<div class={[{ 'is-plain': !props.input }, 'vc-select-search']}>
					{
						props.input && (
							<InputSearch
								ref={input}
								class="vc-select-search__input"
								modelValue={props.modelValue}
								// @ts-ignore
								placeholder={props.placeholder}
								onInput={handleSearch}
							/>
						)
					}
					{ slots.default?.() }
				</div>
			);
		};
	}
});
