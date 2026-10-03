<template>
	<div ref="root" class="audit-cards" :class="{ 'is-masonry': enabled }"><slot /></div>
</template>
<script setup>
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import { balanceGrid } from './grid-layout';

const root = ref();
const enabled = ref(false);
const cards = new Set();
let observer;
let previousEntries = [];
let previousColumns;
let fixedColumns;
const refresh = () => {
	const element = root.value;
	if (!element || !observer) return;
	const children = new Set(element.children);
	for (const card of cards) {
		if (!children.has(card)) { observer.unobserve(card); cards.delete(card); }
	}
	const style = getComputedStyle(element);
	const gap = parseFloat(style.columnGap) || 0;
	const columns = Number(style.getPropertyValue('--audit-grid-columns')) || 1;
	const entries = [...children];
	const changed = columns !== previousColumns || entries.length !== previousEntries.length
		|| entries.some((card, index) => card !== previousEntries[index]);
	// 高度变化只重排列内位置，避免动画每一帧都重新分列、推走正在操作的卡片。
	const layout = balanceGrid(entries.map(card => ({
		span: Math.max(1, Math.ceil(card.getBoundingClientRect().height + gap)),
		wide: card.classList.contains('is-wide')
	})), columns, changed ? undefined : fixedColumns);
	previousEntries = entries;
	previousColumns = columns;
	fixedColumns = layout.map(item => item.column);
	// 只生成卡片边界对应的轨道，避免按像素生成数千条 Grid 轨道。
	const boundaries = [...new Set(layout.flatMap(item => [item.row - 1, item.row - 1 + item.span]))].sort((a, b) => a - b);
	const tracks = boundaries.slice(1).map((value, index) => `${value - boundaries[index]}px`).join(' ');
	if (element.style.gridTemplateRows !== tracks) element.style.gridTemplateRows = tracks;
	entries.forEach((card, index) => {
		if (!cards.has(card)) { observer.observe(card); cards.add(card); }
		const item = layout[index];
		const values = {
			gridRowStart: String(boundaries.indexOf(item.row - 1) + 1),
			gridRowEnd: String(boundaries.indexOf(item.row - 1 + item.span) + 1),
			gridColumnStart: String(item.column), gridColumnEnd: `span ${item.width}`,
			alignSelf: 'start'
		};
		for (const [property, value] of Object.entries(values)) {
			if (card.style[property] !== value) card.style[property] = value;
		}
	});
};
onMounted(async () => {
	if (typeof ResizeObserver === 'undefined') return;
	observer = new ResizeObserver(refresh);
	observer.observe(root.value);
	enabled.value = true;
	await nextTick();
	refresh();
});
onUpdated(refresh);
onBeforeUnmount(() => observer?.disconnect());
</script>
