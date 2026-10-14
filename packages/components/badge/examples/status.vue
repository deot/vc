<template>
	<div class="badge-demo">
		<p>status：default / pending / success / warning / error</p>
		<div class="badge-demo__row">
			<Badge v-for="status in STATUSES" :key="status" :status="status" />
		</div>

		<p>label：状态点旁的文字</p>
		<div class="badge-demo__row">
			<Badge v-for="status in STATUSES" :key="status" :status="status" :label="status" />
		</div>

		<p>color：任意 CSS 颜色；只传 label 时 status 按 default</p>
		<div class="badge-demo__row is-wrap">
			<Badge v-for="color in COLORS" :key="color" :color="color" :label="color" />
		</div>

		<p>label：插槽、函数、{ type: 'html', value }；与默认插槽同用时状态点跟在内容后</p>
		<div class="badge-demo__row">
			<Badge status="success">
				<template #label>
					<span>插槽：<b>已完成</b></span>
				</template>
			</Badge>
			<Badge status="pending" :label="renderLabel" />
			<Badge status="error" :label="{ type: 'html', value: '<i>HTML</i>' }" />
			<Badge status="warning" label="说明">
				<span>内容</span>
			</Badge>
		</div>
	</div>
</template>
<script setup>
import { h } from 'vue';
import { Badge } from '..';

const STATUSES = ['default', 'pending', 'success', 'warning', 'error'];
const COLORS = [
	'#F53F3F',
	'#7816FF',
	'#00B42A',
	'#165DFF',
	'#FF7D00',
	'#EB0AA4',
	'#7BC616',
	'#86909C',
	'#B71DE8',
	'#0FC6C2',
	'#FFB400',
	'#168CFF',
	'#FF5722',
	'var(--vc-color-primary)'
];

const renderLabel = () => h('span', '函数');
</script>
<style>
.badge-demo {
	padding: 20px;
	background: var(--vc-background-color-lightest);
}

.badge-demo__row {
	display: flex;
	align-items: center;
	gap: 24px;
	margin-bottom: 24px;
}

.badge-demo__row.is-wrap {
	flex-wrap: wrap;
}
</style>
