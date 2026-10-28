<template>
	<div class="reveal-demo">
		<p class="reveal-demo__tip">
			点击任一按钮（点在按钮里的图标上也一样）：卡片从点中的按钮展开，再点一次（或点卡片里的关闭）缩回打开它的按钮。
			展开途中再点会沿原路退回。triggerElement 选「固定元素」时总是从虚线框展开；选 null 时淡入淡出。
			offset 裁掉靠近按钮的一段：打开立即从这一刻的姿态弹出，关闭停在同一个姿态结束；auto 按布局取窗口刚离开按钮的姿态（最多到路程 40%），按钮离得远时按钮上不留残影，离得近或被卡片盖住时从 40% 处长出来（Modal 用的是 auto，并打开了 opacity）。
			opacity 让卡片在播放的这一段里匀速淡入、淡出（Modal 同时打开了它）；delay 让窗口先展开、卡片晚一点淡入。这几项都适合卡片和按钮长得不一样的场景，可以叠加。
		</p>
		<div class="reveal-demo__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
				@change="visible = false"
			/>
		</div>
		<div class="reveal-demo__stage">
			<!-- wait=0：按钮默认 250ms 防抖，展开途中再点才能触发退回 -->
			<Button class="reveal-demo__toggle is-start" :wait="0" @click="toggle">
				左上
			</Button>
			<Button class="reveal-demo__toggle is-end" type="primary" :wait="0" @click="toggle">
				右上
			</Button>
			<Button class="reveal-demo__toggle is-bottom" :wait="0" @click="toggle">
				<Icon type="time" /> 底部
			</Button>
			<div ref="anchor" class="reveal-demo__anchor">
				固定元素
			</div>
			<!-- 父元素是裁切的窗口：只放这一个子元素，自身不做变换 -->
			<div class="reveal-demo__frame">
				<TransitionReveal
					:key="`${controls.trigger}-${controls.offset}-${controls.opacity}-${controls.delay}`"
					:trigger-element="triggerElement"
					:offset="toTiming(controls.offset)"
					:opacity="controls.opacity"
					:delay="toTiming(controls.delay)"
				>
					<div v-show="visible" class="reveal-demo__panel">
						<p class="reveal-demo__title">
							标题
						</p>
						<p>第一行说明文字</p>
						<p>第二行说明文字，长度略长一些</p>
						<Button @click="visible = false">
							关闭
						</Button>
					</div>
				</TransitionReveal>
			</div>
		</div>
	</div>
</template>
<script setup>
import { computed, reactive, ref } from 'vue';
import { Button } from '../../button';
import { Icon } from '../../icon';
import { Select } from '../../select';
import { TransitionReveal } from '..';

// offset、delay 共用的取值；'enter' 表示只作用于打开
const TIMING_OPTIONS = [
	...[0, 60, 80, 110, 160].map(value => ({ value, label: String(value) })),
	{ value: 'enter', label: '{ enter: 80, leave: 0 }' }
];
const toTiming = value => (value === 'enter' ? { enter: 80, leave: 0 } : value);

// 对照项：每项一个 Select，切换时重新挂载
const CONTROLS = [
	{
		key: 'trigger',
		label: 'triggerElement',
		data: [
			{ value: 'click', label: '不传：打开那次点击的元素' },
			{ value: 'fixed', label: '固定元素' },
			{ value: 'none', label: 'null：淡入淡出' }
		]
	},
	{ key: 'offset', label: 'offset', data: [{ value: 'auto', label: 'auto：刚离开按钮的姿态' }, ...TIMING_OPTIONS] },
	{ key: 'opacity', label: 'opacity', data: [{ value: false, label: 'false' }, { value: true, label: 'true' }] },
	{ key: 'delay', label: 'delay', data: TIMING_OPTIONS }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const anchor = ref(null);
const visible = ref(false);

const triggerElement = computed(() => {
	if (controls.trigger === 'fixed') return anchor.value;
	return controls.trigger === 'none' ? null : undefined;
});

const toggle = () => {
	visible.value = !visible.value;
};
</script>

<style lang="scss">
.reveal-demo {
	padding: 40px;

	&__tip {
		color: #666;
	}

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;

		.vc-select {
			width: 280px;
		}
	}

	&__stage {
		position: relative;
		height: 420px;
		max-width: 720px;
		border: 1px solid var(--vc-border-color, #ddd);
		border-radius: 8px;
	}

	&__toggle {
		position: absolute;

		&.is-start {
			top: 16px;
			left: 16px;
		}

		&.is-end {
			top: 16px;
			right: 16px;
		}

		&.is-bottom {
			bottom: 16px;
			left: 50%;
			transform: translateX(-50%);
		}
	}

	&__anchor {
		position: absolute;
		bottom: 24px;
		left: 24px;
		padding: 8px 12px;
		color: #999;
		border: 1px dashed #bbb;
		border-radius: 4px;
	}

	// 铺满舞台的窗口，不挡住下面的按钮
	&__frame {
		position: absolute;
		pointer-events: none;
		inset: 0;
	}

	&__panel {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 320px;
		padding: 20px;
		margin: -90px 0 0 -160px;
		pointer-events: auto;
		background: var(--vc-background-color, #fff);
		border-radius: 8px;
		box-shadow: 0 6px 24px rgb(0 0 0 / 16%);
		box-sizing: border-box;
	}

	&__title {
		margin-top: 0;
		font-weight: 600;
	}
}
</style>
