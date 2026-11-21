/** @jsxImportSource vue */

import { ref, computed, watch } from 'vue';
import type { SetupContext } from 'vue';
import type { Props } from './alert-props';
import { Customer } from '../customer';
import { Icon } from '../icon';
import { TransitionFade } from '../transition';
import type { Marquee } from '../marquee';

// 跑马灯默认先停留 1s 再滚动
const MARQUEE_DEFAULTS = { delay: 1000 };

/**
 * Alert 与 MAlert 共用
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param options ~
 * @param options.mobile 移动端（MAlert）：根节点加标记类 vcm-alert，尺寸与配色由 mobile/style.scss 覆盖局部变量
 * @param options.Marquee 标题行跑马灯使用的组件（Marquee / MMarquee）
 * @returns render
 */
export const useAlert = (
	props: Props,
	{ slots, emit }: SetupContext<['close', 'update:modelValue', 'visible-change']>,
	options: { mobile?: boolean; Marquee: typeof Marquee }
) => {
	const name = options.mobile ? 'vc-alert vcm-alert' : 'vc-alert';
	const { Marquee: MarqueeComponent } = options;
	const isActive = ref(false);

	const showIcon = computed(() => props.icon !== false);
	const iconType = computed(() => {
		return typeof props.icon === 'string' && props.icon ? props.icon : props.type;
	});

	const handleClose = () => {
		isActive.value = false;

		emit('close');
		emit('update:modelValue', false);
		emit('visible-change', false);
	};

	watch(
		() => props.modelValue,
		(v) => {
			isActive.value = v;
		},
		{ immediate: true }
	);

	const renderTitle = () => {
		const title = slots.default || props.title;
		if (!props.marquee) {
			return (<Customer wrap class="vc-alert__title" render={title} />);
		}
		return (
			<div class="vc-alert__title">
				<MarqueeComponent {...MARQUEE_DEFAULTS} {...props.marqueeOptions} content={title} />
			</div>
		);
	};

	const renderPrefix = () => {
		if (slots.prefix) return (<div class="vc-alert__prefix">{slots.prefix()}</div>);
		return showIcon.value && (
			<div class="vc-alert__icon">
				<Icon type={iconType.value} />
			</div>
		);
	};

	return () => {
		const description = slots.description || props.description;
		return (
			<TransitionFade>
				{
					isActive.value && (
						<div
							class={[
								`is-${props.type}`,
								{ 'has-icon': showIcon.value && !slots.prefix, 'has-desc': description },
								name
							]}
						>
							{renderPrefix()}
							<div class="vc-alert__content">
								{renderTitle()}
								{ !!description && (<Customer wrap class="vc-alert__desc" render={description} />) }
							</div>
							{ slots.suffix && (<div class="vc-alert__suffix">{slots.suffix()}</div>) }
							{
								props.closable && (
									<div class="vc-alert__close" onClick={handleClose}>
										{ slots.close ? slots.close() : (<Icon type="close" />) }
									</div>
								)
							}
						</div>
					)
				}
			</TransitionFade>
		);
	};
};
