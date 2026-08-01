<template>
	<div class="external-scroller-demo">
		<header class="demo-header">
			<h1>VC Scroller 作为外部纵向视口</h1>
			<div class="mode-switcher">
				<label v-for="option in modes" :key="option.value">
					<input v-model="mode" type="radio" :value="option.value">
					{{ option.label }}
				</label>
				<button type="button" @click="listRef?.scrollToIndex(10, -24)">定位第 10 行</button>
			</div>
			<p>
				当前请求批次：{{ loadedPage }}。Head 与 Footer 属于外层 Scroller，加载边界只取 RecycleList 自身。
			</p>
		</header>

		<Scroller
			class="viewport"
			height="520px"
			:native="false"
			:always="true"
		>
			<section class="external-section head-section">
				<h2>Head</h2>
				<p>先滚过这段外部内容，再进入虚拟列表。</p>
				<p>pullable 模式继续遵循原语义：只有外部主轴承载者位于绝对起点 0 时才可触发。</p>
			</section>

			<RecycleList
				:key="mode"
				ref="listRef"
				class="external-list"
				:fill="false"
				:pullable="mode === 'pullable'"
				:inverted="mode === 'inverted'"
				:batch-count="18"
				:load-data="loadData"
			>
				<template #default="{ row }">
					<div
						:key="row.id"
						class="list-row"
						:style="{ minHeight: `${row.height}px` }"
					>
						<strong>{{ row.id }}</strong>
						<span>page {{ row.page }} · {{ row.height }}px</span>
					</div>
				</template>
				<template #loading>
					<div class="state-row">Loading page {{ loadedPage }}…</div>
				</template>
				<template #complete>
					<div class="state-row">RecycleList complete</div>
				</template>
			</RecycleList>

			<section class="external-section footer-section">
				<h2>Footer</h2>
				<p v-for="item in 4" :key="item">外部尾部内容 {{ item }}</p>
				<p>即使 Footer 很长，列表也会在进入自身尾部时加载下一批。</p>
			</section>
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Scroller } from '../../scroller';
import { RecycleList } from '..';

const modes = [
	{ label: '普通', value: 'normal' },
	{ label: 'pullable', value: 'pullable' },
	{ label: 'inverted', value: 'inverted' }
];

const mode = ref('normal');
const listRef = ref();
const loadedPage = ref(0);
const pageSize = 18;
const pageTotal = 5;

const loadData = ({ current }) => new Promise((resolve) => {
	loadedPage.value = current;
	setTimeout(() => {
		if (current > pageTotal) {
			resolve(false);
			return;
		}

		const data = Array.from({ length: pageSize }, (_, index) => {
			const offset = (current - 1) * pageSize + index;
			return {
				id: `${mode.value}-${offset}`,
				page: current,
				height: 52 + (offset % 3) * 18
			};
		});
		resolve({ data, finished: current === pageTotal });
	}, 220);
});
</script>

<style scoped>
.external-scroller-demo {
	padding: 24px;
	color: #263238;
}

.demo-header,
.viewport {
	max-width: 920px;
	margin: 0 auto;
}

.demo-header {
	margin-bottom: 16px;
}

.mode-switcher {
	display: flex;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;
}

.mode-switcher label {
	display: inline-flex;
	align-items: center;
	gap: 4px;
}

.mode-switcher button {
	padding: 6px 12px;
	cursor: pointer;
}

.viewport {
	background: #f5f7fa;
	border: 1px solid #b9c6d3;
	border-radius: 10px;
}

.external-section {
	padding: 24px;
	box-sizing: border-box;
}

.head-section {
	min-height: 300px;
	background: #e8f3ff;
}

.footer-section {
	min-height: 480px;
	background: #fff7e6;
}

.footer-section p {
	min-height: 52px;
}

.external-list {
	margin: 18px;
	background: #fff;
	border: 2px solid #409eff;
}

.list-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 16px;
	border-bottom: 1px solid #e5eaf0;
	box-sizing: border-box;
}

.state-row {
	padding: 18px;
	color: #657786;
	text-align: center;
}
</style>
