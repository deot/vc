<template>
	<div class="tour-demo">
		<div class="tour-demo__toolbar">
			<Button type="primary" @click="handleStart">开始两步引导</Button>
			<span>{{ resultType }}</span>
		</div>
		<div ref="summaryPanel" class="tour-demo__summary">
			<h3>条目概览</h3>
			<div class="tour-demo__stats">
				<div><span>待处理条目</span><strong>5 项</strong></div>
				<div><span>已完成条目</span><strong>10 项</strong></div>
				<div><span>条目总数</span><strong>15 项</strong></div>
			</div>
		</div>
		<div class="tour-demo__detail">
			<h3>条目列表</h3>
			<Button ref="actionButton" type="primary" size="small" @click="handleAdd">＋ 创建条目</Button>
			<p>已新增 {{ itemCount }} 个示例条目</p>
			<table>
				<thead><tr><th>编号</th><th>名称</th><th>分组</th><th>数量</th></tr></thead>
				<tbody>
					<tr v-for="item in items" :key="item.id">
						<td>{{ item.id }}</td><td>{{ item.name }}</td><td>{{ item.group }}</td><td>{{ item.quantity }}</td>
					</tr>
				</tbody>
			</table>
		</div>
		<Tour v-model="isActive" :previous-text="false" :closable="false" :arrow="false" @close="handleClose">
			<TourStep :element="() => actionButton?.$el" title="第一步、操作按钮" content="这里是创建条目的操作入口。" placement="right" />
			<TourStep :element="() => summaryPanel" title="第二步、查看概览">
				<template #content>
					<p>此区域展示条目数量和完成进度。</p>
					<div class="tour-demo__illustration"><span>图文内容</span><small>支持插槽展示图片或二维码</small></div>
				</template>
			</TourStep>
		</Tour>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button } from '../../button';
import { Tour, TourStep } from '..';

const isActive = ref(false);
const actionButton = ref();
const summaryPanel = ref();
const itemCount = ref(0);
const resultType = ref('');
const items = [
	{ id: 'item-01', name: '条目 01', group: '分组 A', quantity: 10 },
	{ id: 'item-02', name: '条目 02', group: '分组 B', quantity: 20 },
	{ id: 'item-03', name: '条目 03', group: '分组 A', quantity: 30 }
];
const handleStart = () => { isActive.value = true; };
const handleAdd = () => { itemCount.value++; };
const handleClose = ({ type }) => { resultType.value = type; };
</script>
<style scoped>
.tour-demo { padding: 24px; }

.tour-demo__toolbar {
	display: flex;
	gap: 16px;
	align-items: center;
	margin-bottom: 24px;
}

.tour-demo__summary, .tour-demo__detail {
	padding: 20px;
	border: 1px solid var(--vc-border-color);
	border-radius: 8px;
}

.tour-demo__detail { margin-top: 16px; }

.tour-demo h3 {
	margin: 0 0 16px;
	font-size: 14px;
}

.tour-demo__stats {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.tour-demo__stats > div {
	flex: 1;
	min-width: 150px;
	padding: 20px;
	background: var(--vc-background-color);
	border-radius: 8px;
}

.tour-demo__stats span, .tour-demo__stats strong {
	display: block;
	margin-bottom: 8px;
}

.tour-demo table {
	width: 100%;
	margin-top: 16px;
	border-collapse: collapse;
}

.tour-demo th, .tour-demo td {
	padding: 12px;
	text-align: left;
}

.tour-demo p { margin: 12px 0; }

.tour-demo__illustration {
	display: flex;
	gap: 8px;
	align-items: center;
}

.tour-demo__illustration span {
	padding: 20px 8px;
	background: var(--vc-background-color);
}
</style>
