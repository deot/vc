<!-- 外部视口：列表自身不滚动，主轴滚动由 Window、外层 VC Scroller 或横向的原生容器承载；前后都有不属于列表的内容 -->
<template>
	<main class="recycle-external" :class="`is-${controls.container}`">
		<section class="recycle-external__hero">
			<h1>{{ current.title }}</h1>
			<p>{{ current.description }}</p>
			<p>当前请求批次：{{ loadedPage }}。前后置内容属于外部容器，加载边界只取 RecycleList 自身。</p>
		</section>

		<div class="recycle-external__toolbar">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
			<Button @click="listRef?.scrollTo(0)">scrollTo(0)</Button>
			<Button @click="listRef?.scrollToIndex(...current.locate)">scrollToIndex({{ current.locate[0] }})</Button>
			<Button @click="listRef?.reset()">reset</Button>
			<Button @click="listRef?.refreshLayout()">refreshLayout</Button>
		</div>

		<!-- 换容器时整体重新挂载；模式、lazyTail、尺寸在运行时切换 -->
		<component
			:is="controls.container === 'scroller' ? Scroller : 'div'"
			:key="controls.container"
			class="recycle-external__viewport"
			v-bind="controls.container === 'scroller' ? { height: '520px', native: false, always: true } : {}"
		>
			<div class="recycle-external__track">
				<!-- 被不断增长的列表推走的一侧才延迟展示：正序是后置内容；inverted 数据在头部增长，是前置内容 -->
				<Transition name="reveal">
					<section v-show="!isInverted || loadState.isEnd" class="recycle-external__side is-before">
						<h2>前置内容</h2>
						<p v-for="item in 4" :key="item">
							列表之前的第 {{ item }} 个内容区块：只改变列表在容器中的绝对位置，不计入列表项的位置。
						</p>
					</section>
				</Transition>

				<RecycleList
					ref="listRef"
					class="recycle-external__list"
					:fill="false"
					:vertical="isVertical"
					:pullable="controls.mode === 'pullable'"
					:inverted="isInverted"
					:lazy-tail="controls.lazyTail === 'on'"
					:batch-count="current.pageSize"
					:load-data="loadData"
					@load-change="loadState = $event"
				>
					<template v-if="isVertical" #header>
						<Transition name="reveal" appear>
							<div class="recycle-external__state">RecycleList header</div>
						</Transition>
					</template>
					<template #default="{ row }">
						<article
							:key="row.id"
							class="recycle-external__item"
							:style="isVertical ? { minHeight: `${sizeOf(row)}px` } : { width: `${sizeOf(row)}px` }"
						>
							<strong>#{{ row.id }}</strong>
							<span>第 {{ row.page }} 批 · {{ sizeOf(row) }}px</span>
						</article>
					</template>
					<template #loading>
						<div class="recycle-external__state">正在加载第 {{ loadedPage }} 批…</div>
					</template>
					<template #complete>
						<div class="recycle-external__state">列表数据已全部加载</div>
					</template>
					<template #footer>
						<Transition name="reveal" appear>
							<div class="recycle-external__state">RecycleList footer</div>
						</Transition>
					</template>
				</RecycleList>

				<Transition name="reveal">
					<section v-show="isInverted || loadState.isEnd" class="recycle-external__side is-after">
						<h2>后置内容</h2>
						<p v-for="item in 5" :key="item">
							列表之后的第 {{ item }} 个内容区块：分页在接近列表自身尾部时触发，不会等这里滚完。
						</p>
					</section>
				</Transition>
			</div>
		</component>

		<p class="recycle-external__tip">
			pullable 与 inverted 互斥；pullable 只有在外部承载者位于绝对起点 0 时才可触发（横向沿用 RIGHT 方向）。
		</p>
	</main>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { RecycleList } from '..';
import { Button } from '../../button';
import { Scroller } from '../../scroller';
import { Select } from '../../select';

// 三种容器各自的说明、分页与定位参数
const CONTAINERS = {
	window: {
		title: '页面前置内容 → RecycleList → 页面后置内容',
		description: '列表没有固定高度，纵向滚动由 Window 承载；列表自身仍只渲染视口附近的节点。',
		pageSize: 24,
		pageTotal: 6,
		delay: 240,
		locate: [12, -80]
	},
	scroller: {
		title: 'VC Scroller 作为外部纵向视口',
		description: '外层 Scroller 固定高度并自绘滚动条，列表随它滚动。',
		pageSize: 18,
		pageTotal: 5,
		delay: 220,
		locate: [10, -24]
	},
	horizontal: {
		title: '横向外部虚拟化',
		description: '外层原生元素承载 X 轴，RecycleList 内部继续保留 Y 轴能力。',
		pageSize: 16,
		pageTotal: 5,
		delay: 200,
		locate: [8, -40]
	}
};

// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'container',
		label: '容器',
		data: [
			{ value: 'window', label: 'window（页面滚动）' },
			{ value: 'scroller', label: 'Scroller' },
			{ value: 'horizontal', label: '横向原生容器' }
		]
	},
	{
		key: 'mode',
		label: '模式',
		data: [{ value: 'normal', label: '普通' }, { value: 'pullable', label: 'pullable' }, { value: 'inverted', label: 'inverted' }]
	},
	{ key: 'lazyTail', label: 'lazyTail', data: [{ value: 'on', label: 'true（加载完才展示尾部）' }, { value: 'off', label: 'false' }] },
	{ key: 'size', label: '动态尺寸', data: [{ value: 'compact', label: '紧凑' }, { value: 'loose', label: '宽松' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const current = computed(() => CONTAINERS[controls.container]);
const isVertical = computed(() => controls.container !== 'horizontal');
const isInverted = computed(() => controls.mode === 'inverted');

const listRef = ref();
// load-change 是单向的：列表把快照推过来，外层只读
const createLoadState = () => ({ isEnd: false, isLoading: false, isSilentRefresh: false, isEmpty: false, loaded: 0 });
const loadState = ref(createLoadState());
const loadedPage = ref(0);
// 换容器后列表重新挂载，快照从头开始
watch(() => controls.container, () => {
	loadState.value = createLoadState();
	loadedPage.value = 0;
});

// 尺寸随「动态尺寸」变化：已渲染的项由列表自动感知并重新测量
const sizeOf = (row) => {
	const isLoose = controls.size === 'loose';
	return isVertical.value ? row.height + (isLoose ? 36 : 0) : row.width + (isLoose ? 90 : 0);
};

const loadData = ({ page }) => new Promise((resolve) => {
	const { pageSize, pageTotal, delay } = current.value;
	loadedPage.value = page;
	setTimeout(() => {
		if (page > pageTotal) {
			resolve(false);
			return;
		}

		const data = Array.from({ length: pageSize }, (_, index) => {
			const id = (page - 1) * pageSize + index;
			return {
				id,
				page,
				height: 58 + (id % 4) * 18,
				width: 130 + (id % 5) * 32
			};
		});
		resolve({ data, finished: page === pageTotal });
	}, delay);
});

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss" scoped>
.recycle-external {
	min-width: 680px;
	padding: 24px;
	color: #1f2933;
	background: #f6f8fb;

	&__hero,
	&__toolbar,
	&__viewport,
	&__tip {
		max-width: 960px;
		margin: 0 auto 20px;
	}

	&__hero {
		padding: 28px 32px;
		background: #fff;
		border: 1px solid #e3e9f0;
		border-radius: 12px;
		box-shadow: 0 1px 2px rgb(16 24 40 / 5%);

		h1 {
			margin: 0 0 12px;
			font-size: 22px;
		}

		p {
			margin: 0 0 6px;
			color: #64748b;
		}
	}

	&__toolbar {
		position: sticky;
		top: 8px;
		z-index: 5;
		display: flex;
		padding: 10px 12px;
		background: rgb(255 255 255 / 94%);
		border: 1px solid #e3e9f0;
		border-radius: 10px;
		box-shadow: 0 4px 14px rgb(16 24 40 / 8%);
		backdrop-filter: blur(6px);
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;

		// Select 的根节点带着本组件的 scope，可以直接选中
		.vc-select {
			width: 220px;
		}
	}

	&__side {
		padding: 28px 32px;
		background: #fff;
		border: 1px solid #e3e9f0;
		border-radius: 12px;
		box-shadow: 0 1px 2px rgb(16 24 40 / 5%);
		box-sizing: border-box;

		h2 {
			margin: 0 0 16px;
			font-size: 15px;
			font-weight: 600;
			color: #475569;
		}

		p {
			min-height: 64px;
			padding: 16px;
			margin: 0 0 12px;
			color: #64748b;
			background: #f8fafc;
			border: 1px solid #eef2f7;
			border-radius: 8px;

			&:last-child {
				margin-bottom: 0;
			}
		}
	}

	&__list {
		margin: 20px 0;
		overflow: hidden;
		background: #fff;
		border: 1px solid #e3e9f0;
		border-radius: 12px;
		box-shadow: 0 1px 2px rgb(16 24 40 / 5%);
	}

	&__item {
		display: flex;
		padding: 14px 20px;

		// 行高取整数：默认行高在部分浏览器里是小数，项的实际尺寸与取整后的记录会逐项差出 1px
		line-height: 20px;
		border-bottom: 1px solid #eef2f7;
		box-sizing: border-box;
		align-items: flex-start;
		justify-content: center;
		flex-direction: column;

		span {
			margin-top: 4px;
			color: #475569;
		}
	}

	// header / footer / loading / complete 四类边界统一成安静的说明条
	&__state {
		padding: 14px 16px;
		font-size: 12px;
		letter-spacing: 0.04em;
		color: #94a3b8;
		text-align: center;
		background: #f8fafc;
	}

	&__tip {
		color: #627d98;
	}

	// 外层 Scroller：固定高度的卡片，前后置内容在它里面
	&.is-scroller &__viewport {
		overflow: hidden;
		background: #fff;
		border: 1px solid #e3e9f0;
		border-radius: 12px;
	}

	&.is-scroller &__track {
		padding: 18px;
	}

	// 横向：原生容器承载 X 轴，前置内容、列表、后置内容排成一行
	&.is-horizontal &__viewport {
		height: 320px;
		max-width: none;
		overflow: auto hidden;
		border: 2px solid #627d98;
		border-radius: 10px;
		box-sizing: border-box;
	}

	&.is-horizontal &__track {
		display: flex;
		width: max-content;
		height: 100%;
		min-width: 100%;
		align-items: stretch;
	}

	&.is-horizontal &__side {
		width: 500px;
		height: 100%;
		overflow: hidden;
		border-radius: 0;
		flex: none;

		&.is-after {
			width: 600px;
		}

		p {
			min-height: 0;
			padding: 6px 12px;
			margin-bottom: 6px;
		}
	}

	&.is-horizontal &__list {
		height: 100%;
		margin: 0;
		background: #f7fafc;
		border-color: #409eff;
		border-style: solid;
		border-width: 0 2px;
		border-radius: 0;
		flex: none;
	}

	&.is-horizontal &__item {
		height: 100%;
		padding: 22px;
		border-right: 1px solid #d8e2ec;
		border-bottom: 0;
		flex-shrink: 0;
		justify-content: flex-start;
	}

	&.is-horizontal &__state {
		display: flex;
		height: 100%;
		padding: 0 28px;
		align-items: center;
	}
}

// 延迟展示的内容淡入，避免加载完成的一瞬间直接弹出
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
