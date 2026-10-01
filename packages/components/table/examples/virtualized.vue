<!-- 外部视口虚拟化：Table 不设高度，纵向滚动由 Window 或外层 VC Scroller 承载；Table 内部仍负责横向滚动、固定列、表头与合计行的吸附 -->
<template>
	<main class="table-virtualized" :class="`is-${controls.container}`">
		<section class="table-virtualized__hero">
			<h1>{{ isScroller ? 'VC Scroller 中的外部虚拟化 Table' : '页面流中的外部虚拟化 Table' }}</h1>
			<p>
				Table 未设置 height / max-height，通过 virtualized 使用{{ isScroller ? '外层 Scroller ' : ' Window ' }}的纵向滚动；
				表格内部仍负责横向滚动和固定列。行高变化由虚拟列表自动感知并重新测量，吸底的 dock（横向滚动条 + 合计行）随之刷新。
			</p>
			<div class="table-virtualized__controls">
				<Select
					v-for="item in CONTROLS"
					:key="item.key"
					v-model="controls[item.key]"
					:data="item.data"
					:label="item.label"
				/>
			</div>
			<p>已构建 {{ loadState.loaded }} / {{ tableData.length }} 行{{ loadState.isEnd ? '（全部构建完成，展示后置内容）' : '' }}</p>
		</section>

		<!-- 换容器时整体重新挂载 -->
		<component
			:is="isScroller ? Scroller : 'div'"
			ref="containerRef"
			:key="controls.container"
			class="table-virtualized__viewport"
			v-bind="isScroller ? { height: '560px', native: false, always: true } : {}"
		>
			<section class="table-virtualized__side is-before">
				<h2>前置内容</h2>
				<p v-for="item in 4" :key="item">
					前置区块 {{ item }}：参与外部容器的文档流，但不会进入虚拟行的局部坐标。
				</p>
			</section>

			<Table
				ref="tableRef"
				class="table-virtualized__table"
				primary-key="id"
				virtualized
				lazy-tail
				border
				stripe
				show-summary
				:fit="false"
				:affix="affix"
				:data="tableData"
				@load-change="loadState = $event"
			>
				<TableColumn type="selection" fixed="left" :width="64" />
				<TableColumn prop="id" label="ID" fixed="left" :width="100" />
				<TableColumn prop="name" label="名称" fixed="left" :width="180">
					<template #default="{ row }">
						<strong>{{ row.name }}</strong>
					</template>
				</TableColumn>
				<TableColumn prop="group" label="分组" :width="200" />
				<TableColumn prop="type" label="类型" :width="160" />
				<TableColumn prop="code" label="编号" :width="180" />
				<TableColumn prop="tag" label="标签" :width="160" />
				<TableColumn prop="valueA" label="数值 A" :width="130" />
				<TableColumn prop="valueB" label="数值 B" :width="140" />
				<TableColumn prop="updatedAt" label="更新时间" :width="210" />
				<TableColumn prop="desc" label="说明（动态行高）" :width="340">
					<template #default="{ row, rowIndex }">
						<!-- 每 9 行一个更高的单元格；「动态行高」展开后所有行都变高 -->
						<div class="table-virtualized__cell" :class="{ 'is-expanded': isExpanded, 'is-tall': rowIndex % 9 === 0 }">
							{{ row.desc }}
						</div>
					</template>
				</TableColumn>
				<TableColumn label="操作" fixed="right" :width="120">
					<template #default="{ rowIndex }">
						<a href="javascript:;">查看 {{ rowIndex }}</a>
					</template>
				</TableColumn>
				<template #append>
					<div class="table-virtualized__append">Table append slot</div>
				</template>
			</Table>

			<!-- lazy-tail：全部行构建完成后才展示后置内容，虚拟表格的尾部边界不会延伸到这里 -->
			<Transition name="reveal">
				<section v-show="loadState.isEnd" class="table-virtualized__side is-after">
					<h2>后置内容</h2>
					<p v-for="item in 5" :key="item">后置区块 {{ item }}</p>
				</section>
			</Transition>
		</component>

		<p v-if="isScroller" class="table-virtualized__note">
			Affix 按窗口定位：表头的 <code>offset</code> 为 Scroller 视口顶部到窗口顶部的距离，
			底部 dock（横向滚动条 + 合计行）的 <code>offset</code> 为 Scroller 视口底部到窗口底部的距离，
			两者在挂载、窗口滚动与尺寸变化时重新计算。
		</p>
	</main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Table, TableColumn } from '..';
import { Scroller } from '../../scroller';
import { Select } from '../../select';

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'container', label: '滚动容器', data: [{ value: 'window', label: 'window（页面滚动）' }, { value: 'scroller', label: 'Scroller' }] },
	{ key: 'rowSize', label: '动态行高', data: [{ value: 'collapsed', label: '收起（两行截断）' }, { value: 'expanded', label: '展开' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const isScroller = computed(() => controls.container === 'scroller');
const isExpanded = computed(() => controls.rowSize === 'expanded');

const containerRef = ref();
const tableRef = ref();

// load-change 是单向的：表格把快照推过来，外层只读
const createLoadState = () => ({ isEnd: false, isLoading: false, isSilentRefresh: false, isEmpty: false, loaded: 0 });
const loadState = ref(createLoadState());

const tableData = Array.from({ length: 2000 }, (_, index) => ({
	id: index + 1,
	name: `条目 ${index + 1}`,
	group: `分组 ${(index % 17) + 1}`,
	type: `类型 ${(index % 8) + 1}`,
	code: `NO${String(index + 1).padStart(6, '0')}`,
	tag: `标签 ${(index % 12) + 1}`,
	valueA: (index * 13) % 1000,
	valueB: (99 + (index % 400)).toFixed(2),
	updatedAt: `2026-08-${String((index % 28) + 1).padStart(2, '0')} 10:30`,
	desc: `第 ${index + 1} 行使用动态内容高度。切换「动态行高」可让已渲染的行发生尺寸变化，并继续由虚拟列表测量。`
}));

// Affix 按窗口定位。页面滚动时直接给偏移；嵌套在 Scroller 里时，两端的偏移取 Scroller 视口到窗口边缘的距离，
// 挂载、窗口滚动与尺寸变化时重新计算，变化后让 Table 重算吸附
const offsets = reactive({ top: 0, bottom: 0 });
const updateOffsets = () => {
	const el = isScroller.value ? containerRef.value?.wrapper : void 0;
	if (!el) return;
	// 视口取滚动容器边框内的区域（Scroller 的 class / 边框作用在滚动容器上）
	const viewportTop = el.getBoundingClientRect().top + el.clientTop;
	const top = Math.max(0, viewportTop);
	const bottom = Math.max(0, window.innerHeight - (viewportTop + el.clientHeight));
	if (top === offsets.top && bottom === offsets.bottom) return;
	offsets.top = top;
	offsets.bottom = bottom;
	nextTick(() => tableRef.value?.refreshAffix());
};
const affix = computed(() => (isScroller.value ? [{ offset: offsets.top }, { offset: offsets.bottom }] : { offset: 8 }));

onMounted(() => {
	updateOffsets();
	window.addEventListener('resize', updateOffsets);
	window.addEventListener('scroll', updateOffsets, { passive: true });
});
// 换容器后表格重新挂载：快照从头开始，偏移按新容器重算
watch(() => controls.container, () => {
	loadState.value = createLoadState();
	nextTick(updateOffsets);
});

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => {
	window.removeEventListener('resize', updateOffsets);
	window.removeEventListener('scroll', updateOffsets);
	window.$perf?.disconnect();
});
</script>

<style lang="scss" scoped>
.table-virtualized {
	min-width: 760px;
	padding: 24px;
	color: #273444;
	background: #f5f7fa;

	&__hero,
	&__viewport,
	&__note {
		max-width: 1180px;
		margin-right: auto;
		margin-left: auto;
	}

	&__hero {
		padding: 28px;
		margin-bottom: 24px;
		background: #fff;
		border: 1px solid #d8e2ec;
		border-radius: 10px;

		h1 {
			margin: 0 0 12px;
			font-size: 22px;
		}
	}

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin: 16px 0 8px;

		// Select 的根节点带着本组件的 scope，可以直接选中
		.vc-select {
			width: 260px;
		}
	}

	&__side {
		padding: 28px;
		background: #fff;
		border: 1px solid #d8e2ec;
		border-radius: 10px;
		box-sizing: border-box;

		p {
			min-height: 58px;
			padding: 14px;
			background: #f3f6f9;
			border-radius: 6px;
		}

		&.is-before {
			margin-bottom: 24px;
		}

		&.is-after {
			margin-top: 24px;
		}
	}

	&__table {
		background: #fff;
	}

	&__cell {
		display: -webkit-box;
		max-height: 42px;
		overflow: hidden;
		line-height: 21px;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;

		&.is-tall {
			max-height: 76px;
			min-height: 76px;
			padding-top: 8px;
			box-sizing: border-box;
		}

		&.is-expanded {
			display: block;
			max-height: none;
			min-height: 84px;
		}
	}

	&__append {
		padding: 16px;
		color: #66788a;
		text-align: center;
		background: #f8fafc;
	}

	&__note {
		margin-top: 14px;
		color: #66788a;
	}

	// 外层 Scroller：固定高度的容器，前后置内容与表格都在它里面
	&.is-scroller &__viewport {
		background: #f5f7fa;
		border: 1px solid #b8c4d1;
		border-radius: 10px;
	}

	&.is-scroller &__side {
		border-width: 0;
		border-radius: 0;
	}

	&.is-scroller &__table {
		width: calc(100% - 40px);
		margin: 0 20px;
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
