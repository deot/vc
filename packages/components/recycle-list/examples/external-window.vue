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
			<button type="button" @click="lazyTail = !lazyTail">
				lazyTail：{{ lazyTail }}
			</button>
		</div>

		<!-- 被不断增长的列表推走的一侧才延迟展示：正序是后置内容，inverted 数据在头部增长，是前置内容 -->
		<Transition name="reveal">
			<section v-show="!inverted || loadState.isEnd" class="before-content">
				<h2>其他头部内容</h2>
				<p v-for="item in 4" :key="item">
					这是列表之前的第 {{ item }} 个内容区块。它只改变列表在页面中的绝对位置，不计入 item position。
				</p>
			</section>
		</Transition>

		<RecycleList
			ref="listRef"
			class="external-list"
			:fill="false"
			:inverted="inverted"
			:lazy-tail="lazyTail"
			:batch-count="24"
			:load-data="loadData"
			@load-change="loadState = $event"
		>
			<template #header>
				<Transition name="reveal" appear>
					<div class="list-boundary">RecycleList header</div>
				</Transition>
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
				<Transition name="reveal" appear>
					<div class="list-boundary">RecycleList footer</div>
				</Transition>
			</template>
		</RecycleList>

		<Transition name="reveal">
			<section v-show="inverted || loadState.isEnd" class="after-content">
				<h2>其他尾部内容</h2>
				<p v-for="item in 5" :key="item">
					这是列表之后的第 {{ item }} 个内容区块。分页在接近列表自身尾部时触发，不会等待这里滚动结束。
				</p>
			</section>
		</Transition>
	</main>
</template>

<script setup>
import { ref } from 'vue';
import { RecycleList } from '..';

const listRef = ref();
const compact = ref(true);
const inverted = ref(false);
const lazyTail = ref(true);
// load-change 是单向的：列表把快照推过来，外层只读
const loadState = ref({ isEnd: false, isLoading: false, isSilentRefresh: false, isEmpty: false });

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
	color: #1f2933;
	background: #f6f8fb;
}

.hero,
.before-content,
.after-content {
	max-width: 960px;
	padding: 28px 32px;
	margin: 0 auto 20px;
	background: #fff;
	border: 1px solid #e3e9f0;
	border-radius: 12px;
	box-shadow: 0 1px 2px rgb(16 24 40 / 5%);
}

.hero {
	min-height: 180px;
}

.hero h1 {
	margin: 0 0 12px;
	font-size: 22px;
}

.hero p {
	margin: 0;
	color: #64748b;
}

.eyebrow {
	margin: 0 0 6px;
	font-size: 12px;
	font-weight: 600;
	color: #3b82f6;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.before-content h2,
.after-content h2 {
	margin: 0 0 16px;
	font-size: 15px;
	font-weight: 600;
	color: #475569;
}

.before-content p,
.after-content p {
	min-height: 64px;
	padding: 16px;
	margin: 0 0 12px;
	color: #64748b;
	background: #f8fafc;
	border: 1px solid #eef2f7;
	border-radius: 8px;
}

.before-content p:last-child,
.after-content p:last-child {
	margin-bottom: 0;
}

.toolbar {
	position: sticky;
	top: 8px;
	z-index: 5;
	display: flex;
	max-width: 960px;
	padding: 10px 12px;
	margin: 0 auto 20px;
	background: rgb(255 255 255 / 94%);
	border: 1px solid #e3e9f0;
	border-radius: 10px;
	box-shadow: 0 4px 14px rgb(16 24 40 / 8%);
	backdrop-filter: blur(6px);
	flex-wrap: wrap;
	gap: 8px;
}

.toolbar button {
	padding: 7px 12px;
	font-size: 13px;
	color: #334155;
	cursor: pointer;
	background: #fff;
	border: 1px solid #d7dfe8;
	border-radius: 6px;
	transition: color 0.15s ease, border-color 0.15s ease;
}

.toolbar button:hover {
	color: #2563eb;
	border-color: #9cbcf0;
}

.external-list {
	max-width: 960px;
	margin: 0 auto 20px;
	overflow: hidden;
	background: #fff;
	border: 1px solid #e3e9f0;
	border-radius: 12px;
	box-shadow: 0 1px 2px rgb(16 24 40 / 5%);
}

.list-item {
	display: flex;
	padding: 14px 20px;
	border-bottom: 1px solid #eef2f7;
	box-sizing: border-box;
	align-items: flex-start;
	justify-content: center;
	flex-direction: column;
}

.list-item span,
.list-item small {
	margin-top: 4px;
}

.list-item span {
	color: #475569;
}

.list-item small {
	color: #94a3b8;
}

/* header / footer / loading / complete 四类边界统一成安静的说明条 */
.list-boundary {
	padding: 14px 16px;
	font-size: 12px;
	color: #94a3b8;
	letter-spacing: 0.04em;
	text-align: center;
	background: #f8fafc;
}

/* 延迟展示的内容淡入，避免加载完成的一瞬间直接弹出 */
.reveal-enter-active,
.reveal-leave-active {
	transition: opacity 0.24s ease, transform 0.24s ease;
}

.reveal-enter-from,
.reveal-leave-to {
	opacity: 0;
	transform: translateY(8px);
}
</style>
