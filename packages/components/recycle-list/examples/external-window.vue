<template>
	<main class="external-window-demo">
		<section class="hero">
			<p class="eyebrow">Window viewport</p>
			<h1>页面头部内容 → RecycleList → 页面尾部内容</h1>
			<p>
				列表没有固定高度，纵向滚动由 Window 承载；列表自身仍只渲染视口附近的节点。
			</p>
		</section>

		<div class="toolbar">
			<button type="button" @click="handleScrollTop">scrollTo(0)</button>
			<button type="button" @click="handleScrollToIndex">scrollToIndex(12)</button>
			<button type="button" @click="handleReset">reset</button>
			<button type="button" @click="handleRefresh">refreshLayout</button>
			<button type="button" @click="compact = !compact">
				动态行高：{{ compact ? '紧凑' : '宽松' }}
			</button>
			<button type="button" @click="inverted = !inverted">
				inverted：{{ inverted }}
			</button>
		</div>

		<section class="before-content">
			<h2>其他头部内容</h2>
			<p v-for="item in 4" :key="item">
				这是列表之前的第 {{ item }} 个内容区块。它只改变列表在页面中的绝对位置，不计入 item position。
			</p>
		</section>

		<RecycleList
			:key="String(inverted)"
			ref="listRef"
			class="external-list"
			:fill="false"
			:inverted="inverted"
			:batch-count="24"
			:load-data="loadData"
		>
			<template #header>
				<div class="list-boundary">RecycleList header</div>
			</template>
			<template #default="{ row }">
				<article
					:key="row.id"
					class="list-item"
					:style="{ minHeight: `${row.height + (compact ? 0 : 36)}px` }"
				>
					<strong>#{{ row.id }}</strong>
					<span>第 {{ row.page }} 批 · 动态高度 {{ row.height + (compact ? 0 : 36) }}px</span>
					<small>{{ row.description }}</small>
				</article>
			</template>
			<template #loading>
				<div class="list-boundary">正在异步加载…</div>
			</template>
			<template #complete>
				<div class="list-boundary">列表数据已全部加载</div>
			</template>
			<template #footer>
				<div class="list-boundary">RecycleList footer</div>
			</template>
		</RecycleList>

		<section class="after-content">
			<h2>其他尾部内容</h2>
			<p v-for="item in 5" :key="item">
				这是列表之后的第 {{ item }} 个内容区块。分页在接近列表自身尾部时触发，不会等待这里滚动结束。
			</p>
		</section>
	</main>
</template>

<script setup>
import { ref } from 'vue';
import { RecycleList } from '..';

const listRef = ref();
const compact = ref(true);
const inverted = ref(false);

const pageSize = 24;
const pageTotal = 6;

const loadData = ({ current }) => new Promise((resolve) => {
	setTimeout(() => {
		if (current > pageTotal) {
			resolve(false);
			return;
		}

		const data = Array.from({ length: pageSize }, (_, index) => {
			const id = (current - 1) * pageSize + index;
			return {
				id,
				page: current,
				height: 58 + (id % 4) * 18,
				description: `外部 Window 滚动中的虚拟行 ${id}`
			};
		});
		resolve({ data, finished: current === pageTotal });
	}, 240);
});

const handleScrollTop = () => listRef.value?.scrollTo(0);
const handleScrollToIndex = () => listRef.value?.scrollToIndex(12, -80);
const handleReset = () => listRef.value?.reset();
const handleRefresh = () => listRef.value?.refreshLayout();
</script>

<style scoped>
.external-window-demo {
	min-width: 680px;
	padding: 24px;
	color: #263238;
	background: #f6f8fb;
}

.hero,
.before-content,
.after-content {
	max-width: 960px;
	padding: 32px;
	margin: 0 auto 24px;
	background: #fff;
	border: 1px solid #dfe6ee;
	border-radius: 12px;
}

.hero {
	min-height: 180px;
}

.eyebrow {
	font-weight: 600;
	color: #409eff;
}

.before-content p,
.after-content p {
	min-height: 64px;
	padding: 16px;
	background: #f1f5f9;
	border-radius: 8px;
}

.toolbar {
	position: sticky;
	top: 8px;
	z-index: 5;
	display: flex;
	max-width: 960px;
	padding: 12px;
	margin: 0 auto 24px;
	background: rgb(255 255 255 / 92%);
	border-radius: 10px;
	box-shadow: 0 6px 20px rgb(31 45 61 / 12%);
	flex-wrap: wrap;
	gap: 8px;
}

.toolbar button {
	padding: 7px 12px;
	cursor: pointer;
	background: #fff;
	border: 1px solid #b8c4d1;
	border-radius: 6px;
}

.external-list {
	max-width: 960px;
	margin: 0 auto 24px;
	overflow: hidden;
	background: #eaf2f8;
	border: 1px solid #cdd8e3;
	border-radius: 12px;
}

.list-item {
	display: flex;
	padding: 12px 18px;
	background: #fff;
	border-bottom: 1px solid #d5e0ea;
	box-sizing: border-box;
	align-items: flex-start;
	justify-content: center;
	flex-direction: column;
}

.list-item span,
.list-item small {
	margin-top: 4px;
}

.list-item small {
	color: #718096;
}

.list-boundary {
	padding: 16px;
	color: #52616f;
	text-align: center;
}
</style>
