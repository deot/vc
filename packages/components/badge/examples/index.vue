<template>
	<div class="badge-demo">
		<p>基础：value 为数字时显示徽标；dot 显示为小圆点；#dot 插槽自定义徽标（白底）</p>
		<div class="badge-demo__row">
			<Badge :value="9">
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="9" dot dot-style="width: 10px; height: 10px;">
				<span class="badge-demo__box" />
			</Badge>
			<Badge dot-style="width: 16px; height: 16px; font-size: 14px;">
				<span class="badge-demo__box" />
				<template #dot>
					<Icon type="time" style="color: var(--vc-foreground-color-light);" />
				</template>
			</Badge>
		</div>

		<p>独立使用：没有默认插槽时徽标在行内显示</p>
		<div class="badge-demo__row">
			<Badge :value="2" />
			<Badge :value="2" dot-style="background: #E5E6EB; color: #86909C;" />
			<Badge :value="16" />
			<Badge :value="1000" :max="99" />
		</div>

		<p>文字：value 为字符串时原样显示</p>
		<div class="badge-demo__row">
			<Badge value="NEW">
				<span class="badge-demo__box" />
			</Badge>
			<Badge value="HOT">
				<span class="badge-demo__box" />
			</Badge>
		</div>

		<p>max：超过时显示为 max+，默认 99，0 表示不限</p>
		<div class="badge-demo__row">
			<Badge :value="100" :max="10">
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="100">
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="1000" :max="999">
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="1000" :max="0">
				<span class="badge-demo__box" />
			</Badge>
		</div>

		<p>offset：[水平, 垂直]，正值向右、向下</p>
		<div class="badge-demo__row">
			<Badge :value="9" dot :offset="[6, -2]">
				<a href="javascript:void(0)">链接</a>
			</Badge>
			<Badge :value="9" dot :offset="[2, -2]">
				<Icon type="message" style="font-size: 18px; color: #888;" />
			</Badge>
			<Badge :value="5" :offset="[-6, 6]">
				<span class="badge-demo__box" />
			</Badge>
		</div>

		<p>color / dotClass：value 为 0（数字）时隐藏，dot 不传 value 也显示</p>
		<div class="badge-demo__row">
			<Badge :value="8" color="var(--vc-color-primary)">
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="8" dot-class="badge-demo__custom">
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="0">
				<span class="badge-demo__box" />
			</Badge>
			<Badge dot>
				<span class="badge-demo__box" />
			</Badge>
			<Badge :value="0" dot>
				<span class="badge-demo__box" />
			</Badge>
		</div>
	</div>
</template>
<script setup>
import { Badge } from '..';
import { Icon } from '../../icon';
</script>
<style>
.badge-demo {
	padding: 20px;
	background: var(--vc-background-color-lightest);
}

.badge-demo__row {
	display: flex;
	align-items: center;
	gap: 40px;
	margin-bottom: 24px;
}

.badge-demo__box {
	display: block;
	width: 40px;
	height: 40px;
	background: var(--vc-color-neutral);
	border-radius: 4px;
}

.badge-demo__custom {
	background: linear-gradient(90deg, #456CF6, #1DB88C);
}
</style>
