<template>
	<div class="m-badge-demo">
		<h3>数字、圆点、文字（尺寸随 --vc-rem 缩放）</h3>
		<div class="m-badge-demo__row">
			<MBadge :value="2">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge :value="12">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge :value="100">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge dot>
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge value="NEW">
				<span class="m-badge-demo__box" />
			</MBadge>
		</div>

		<h3>独立使用</h3>
		<div class="m-badge-demo__row">
			<MBadge :value="2" />
			<MBadge :value="16" />
			<MBadge :value="1000" :max="999" />
			<MBadge value="NEW" />
			<MBadge dot />
		</div>

		<h3>#dot 插槽与 color</h3>
		<div class="m-badge-demo__row">
			<MBadge>
				<span class="m-badge-demo__box" />
				<template #dot>
					<MIcon type="time" :size="[32, 24]" color="var(--vc-foreground-color-light)" />
				</template>
			</MBadge>
			<MBadge :value="8" color="var(--vc-color-primary)">
				<span class="m-badge-demo__box" />
			</MBadge>
		</div>

		<h3>offset（750 稿）</h3>
		<div class="m-badge-demo__row">
			<MBadge :value="5" :offset="[-12, 12]">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MBadge dot :offset="[8, -4]">
				<span class="m-badge-demo__text">文字</span>
			</MBadge>
		</div>

		<h3>数字变化</h3>
		<div class="m-badge-demo__row">
			<MBadge :value="count">
				<span class="m-badge-demo__box" />
			</MBadge>
			<MButton size="small" @click="count++">
				加一
			</MButton>
			<MButton size="small" @click="count = Math.max(0, count - 1)">
				减一
			</MButton>
		</div>

		<h3>状态点</h3>
		<div class="m-badge-demo__column">
			<MBadge status="default" label="默认" />
			<MBadge status="pending" label="进行中" />
			<MBadge status="success" label="成功" />
			<MBadge status="warning" label="警告" />
			<MBadge status="error" label="失败" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MBadge } from '../index.m';
import { MIcon } from '../../icon/index.m';
import { MButton } from '../../button/index.m';

const count = ref(3);
</script>
<style scoped>
.m-badge-demo {
	padding: 16px;
}

.m-badge-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 48);
	margin-bottom: 16px;
}

.m-badge-demo__column {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 16);
}

.m-badge-demo__box {
	display: block;
	width: calc(var(--vc-rem) * 80);
	height: calc(var(--vc-rem) * 80);
	background-color: var(--vc-background-color-light);
	border-radius: calc(var(--vc-rem) * 8);
}

.m-badge-demo__text {
	font-size: calc(var(--vc-rem) * 28);
}
</style>
