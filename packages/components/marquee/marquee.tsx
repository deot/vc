/** @jsxImportSource vue */

import { defineComponent, ref, watch, computed, onMounted, getCurrentInstance } from 'vue';
import { style as injectStyle } from '@deot/helper-load';
import { getUid } from '@deot/helper-utils';
import { prefixStyle } from '@deot/helper-dom';
import { props as marqueeProps } from './marquee-props';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-marquee';

const ANIMATION = prefixStyle('animation').camel;
const TRANSFORM_KEBAB = prefixStyle('transform').kebab;

export const Marquee = defineComponent({
	name: COMPONENT_NAME,
	props: marqueeProps,
	setup(props, { slots }) {
		const instance = getCurrentInstance()!;
		const duration = ref(0);
		const elW = ref(0);
		const contentW = ref(0);
		const marqueeId = ref(getUid('marquee'));

		const paused = computed(() => {
			return !props.animated || (!props.autoplay && contentW.value < elW.value);
		});

		const style = computed(() => {
			return {
				[ANIMATION]: `${marqueeId.value} ${duration.value}s linear 0s ${paused.value ? 'paused' : 'running'} infinite`
			};
		});

		const refresh = () => {
			elW.value = instance.vnode.el!.offsetWidth;
			contentW.value = instance.vnode.el!.firstChild.offsetWidth;

			if (paused.value) return;

			const FROM = `from { ${TRANSFORM_KEBAB}: translateX(${elW.value}px) }`;
			const TO = `to { ${TRANSFORM_KEBAB}: translateX(-${contentW.value}px) }`;

			injectStyle(`@keyframes ${marqueeId.value} { ${FROM} ${TO} }`);

			duration.value = (elW.value + contentW.value) / props.speed;
		};

		// TODO: content render和slot下也支持重置
		['content', 'speed'].forEach((key) => {
			watch(() => props[key], refresh);
		});

		onMounted(() => {
			// 兼容Portal前动画延迟
			setTimeout(refresh, 0);
		});

		return () => {
			return (
				<div class="vc-marquee">
					<div
						style={style.value}
						class={[{ 'is-paused': paused.value }, 'vc-marquee__content']}
					>
						{
							slots.defalut
								? slots.defalut()
								: typeof props.content === 'string'
									? (<div innerHTML={props.content} />)
									: typeof props.content === 'function'
										? (
												<Customer
													// @ts-ignore
													render={props.content}
												/>
											)
										: null
						}
					</div>
				</div>
			);
		};
	}
});
