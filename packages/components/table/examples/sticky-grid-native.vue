<template>
	<div class="scroll">
		<div class="offset-y">
			<div
				v-for="(_, blockIndex) in data"
				:key="blockIndex"
				:style="rowGridStyle"
				class="row"
			>
				<template v-for="(_, subRow) in rows" :key="subRow">
					<template v-for="(item, columnIndex) in columns" :key="columnIndex">
						<div
							v-if="shouldRenderCell(subRow, columnIndex)"
							class="cell"
							:class="{
								sticky: !!item.fixed,
								'is-left': item.fixed === 'left',
								'is-right': item.fixed === 'right',
							}"
							:style="getCellStyle(rowIndex(blockIndex, subRow), columnIndex)"
							:data-row-index="rowIndex(blockIndex, subRow)"
							:data-column-index="columnIndex"
						>
							{{ item.label }} {{ rowIndex(blockIndex, subRow) }}
						</div>
					</template>
				</template>
			</div>
		</div>
	</div>
</template>
<script setup>
import { computed } from 'vue';

const ROWS = 2;

const columns = computed(() => {
	const total = 10;
	return Array.from({ length: total }, (_, i) => {
		if (i === 0) return { label: 'Fixed Left', fixed: 'left' };
		if (i === 1) return { label: 'Scroll Start' };
		if (i === total - 1) return { label: 'Fixed Right', fixed: 'right' };
		if (i === total - 2) return { label: 'Scroll End' };
		return { label: '~~~~' };
	});
});

const data = computed(() => Array.from({ length: 20 }));

const rows = ROWS;

const rowGridStyle = computed(() => ({
	gridTemplateColumns: `repeat(${columns.value.length}, 1fr)`,
	gridTemplateRows: `repeat(${ROWS}, 1fr)`,
}));

/**
 * @param blockIndex ~
 * @param subRow ~
 * @returns ~
 */
const rowIndex = (blockIndex, subRow) => blockIndex * ROWS + subRow;

/**
 * @param subRow ~
 * @param columnIndex ~
 * @returns ~
 */
const shouldRenderCell = (subRow, columnIndex) => (
	(subRow === 0 && columnIndex !== 2)
	|| (subRow === 1 && columnIndex !== 0 && columnIndex !== 2)
);

/**
 * @param rowIdx ~
 * @param columnIndex ~
 * @returns ~
 */
const getCellStyle = (rowIdx, columnIndex) => {
	const style = {};
	if (columnIndex === 0) {
		style.gridRow = `span ${ROWS} / span ${ROWS}`;
	} else if (columnIndex === 1) {
		style.gridColumn = 'span 2 / span 2';
		if (rowIdx % 2 === 1) {
			style.gridColumnStart = 2;
			style.gridRowStart = 2;
		}
	} else {
		style.gridColumnStart = columnIndex + 1;
		style.gridRowStart = (rowIdx % 2) + 1;
	}
	return style;
};
</script>
<style>
.cell {
	flex-shrink: 0;
	overflow: hidden;
	background: white;
	border: 1px solid #333;
	box-sizing: border-box;
}

.scroll {
	width: 800px;
	height: 400px;
	overflow: auto;
	border: 1px solid #333;
}

.offset-y {
	transform: translate(0, 10px);
}

.row {
	display: grid;
	width: max-content;
}

.sticky {
	position: sticky;
	z-index: 2;
	width: 200px;
	background: white;
	border: 1px solid red!important;

	&.is-left {
		left: 0;
	}

	&.is-right {
		right: 0;
	}
}

</style>
