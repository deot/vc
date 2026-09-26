/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { Customer } from '../customer';
import { Spin } from '../spin';
import type { RecycleListLoadState } from './store';

const COMPONENT_NAME = 'vc-recycle-list-scroll-state';

/**
 * 列表末端的加载 / 完成 / 空状态
 */
export const ScrollState = defineComponent({
	name: COMPONENT_NAME,
	props: {
		loadState: {
			type: Object as PropType<RecycleListLoadState>,
			required: true
		},
		// 不会发起远程请求（disabled），也就没有「加载中」
		disabled: Boolean,
		// 有骨架时由骨架表达加载中
		hasPlaceholder: Boolean,
		renderer: {
			type: Object as PropType<Record<string, any>>,
			required: true
		}
	},
	setup(props, { slots }) {
		/**
		 * 按 slot → render 属性 → 默认内容的优先级渲染一种状态
		 * @param name 状态名
		 * @param fallback 默认内容
		 * @returns 状态内容
		 */
		const renderState = (name: 'loading' | 'complete' | 'empty', fallback: () => any) => {
			return slots[name]?.() || (props.renderer[name] ? (<Customer render={props.renderer[name]} />) : fallback());
		};

		return () => {
			const { loadState } = props;
			return (
				<div class="vc-recycle-list__scroll-state">
					{
						// 静默刷新由刷新提示条表达加载中，这里只隐藏不移除：inverted 下它在首部，移除会让列表整体位移
						!props.disabled && !props.hasPlaceholder && !loadState.isEnd && (
							<div
								class="vc-recycle-list__loading"
								style={{ visibility: loadState.isLoading && !loadState.isSilentRefresh ? 'visible' : 'hidden' }}
							>
								{ renderState('loading', () => (<div class="vc-recycle-list__center"><Spin size={20} /></div>)) }
							</div>
						)
					}
					{
						loadState.isEnd && (
							loadState.isEmpty
								? (
										<div class="vc-recycle-list__empty">
											{ renderState('empty', () => (<div class="vc-recycle-list__center">暂无数据~</div>)) }
										</div>
									)
								: (
										<div class="vc-recycle-list__complete">
											{ renderState('complete', () => (<div class="vc-recycle-list__center">已全部加载~</div>)) }
										</div>
									)
						)
					}
				</div>
			);
		};
	}
});
