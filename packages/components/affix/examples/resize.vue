<template>
	<div class="affix-resize">
		<p class="affix-resize__tip">
			先向下滚动，让吸顶栏、吸底栏和表头都处于吸附状态，再切换"容器宽度"和"内容行数"：
			吸附中的固定层宽度应跟随容器，外层占位高度应跟随内容，不需要滚回原位。
			"0（首帧无尺寸）"模拟容器挂载时还没有尺寸：先选它，滚动到吸附后再切到其他宽度。
			切换项和实时尺寸在左下角，滚动时也能操作。
		</p>
		<div class="affix-resize__panel">
			<div class="affix-resize__controls">
				<Select
					v-for="item in CONTROLS"
					:key="item.key"
					v-model="controls[item.key]"
					:data="item.data"
					:label="item.label"
				/>
			</div>
			<pre class="affix-resize__readout">{{ readout }}</pre>
		</div>

		<div class="affix-resize__container" :style="{ width: controls.width }">
			<Affix ref="topRef" :offset="0">
				<div class="affix-resize__bar">
					<div v-for="i in controls.lines" :key="i">
						吸顶栏 第 {{ i }} 行
					</div>
				</div>
			</Affix>
			<div class="affix-resize__rows">
				<p v-for="i in 20" :key="i">
					条目 {{ i }}
				</p>
			</div>
			<Table :data="rows" primary-key="id" :affix="tableAffix">
				<TableColumn label="名称" prop="name" />
				<TableColumn label="说明" prop="desc" />
				<TableColumn label="数值" prop="value" />
			</Table>
			<div class="affix-resize__rows">
				<p v-for="i in 20" :key="i">
					条目 {{ i + 20 }}
				</p>
			</div>
			<Affix ref="bottomRef" :offset="0" placement="bottom">
				<div class="affix-resize__bar is-bottom">
					<div v-for="i in controls.lines" :key="i">
						吸底栏 第 {{ i }} 行
					</div>
				</div>
			</Affix>
		</div>
	</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { Affix } from '..';
import { Select } from '../../select';
import { Table, TableColumn } from '../../table';

const CONTROLS = [
	{
		key: 'width',
		label: '容器宽度',
		data: [
			{ value: '100%', label: '100%' },
			{ value: '640px', label: '640px' },
			{ value: '360px', label: '360px' },
			{ value: '0px', label: '0（首帧无尺寸）' }
		]
	},
	{ key: 'lines', label: '内容行数', data: [{ value: 1, label: '1 行' }, { value: 3, label: '3 行' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

// 表头吸在吸顶栏下方：吸顶栏高度 = 上下 padding 16 + 每行 20
const tableAffix = computed(() => [{ offset: 16 + controls.lines * 20 }, true]);

const rows = Array.from({ length: 30 }, (_, index) => ({
	id: index + 1,
	name: `条目 ${index + 1}`,
	desc: `说明 ${index + 1}`,
	value: (index + 1) * 10
}));

// 实时读出外层与固定层的行内尺寸，便于对照容器宽度
const topRef = ref();
const bottomRef = ref();
const readout = ref('');
const describe = (name, instance) => {
	const root = instance?.$el;
	const content = root?.firstElementChild;
	if (!content) return `${name}: -`;
	const pinned = content.classList.contains('vc-affix__fixed');
	const size = el => `${el.offsetWidth}×${el.offsetHeight}（行内 ${el.style.width || '-'} × ${el.style.height || '-'}）`;
	return `${name}: ${pinned ? '吸附中' : '未吸附'}，外层 ${size(root)}，固定层 ${size(content)}`;
};
let timer;
const update = () => {
	const header = document.querySelector('.affix-resize .vc-table .vc-affix');
	const headerContent = header?.firstElementChild;
	readout.value = [
		`容器宽度：${controls.width}`,
		describe('吸顶栏', topRef.value),
		describe('吸底栏', bottomRef.value),
		headerContent ? `表头固定层宽度：${headerContent.offsetWidth}` : ''
	].join('\n');
};
onMounted(() => {
	timer = setInterval(update, 200);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<style lang="scss">
.affix-resize {
	padding: 20px 20px 400px;

	&__tip {
		max-width: 720px;
		line-height: 22px;
	}

	// 固定在左下角：吸附状态下也能切换
	&__panel {
		position: fixed;
		bottom: 80px;
		left: 12px;
		z-index: 10;
		padding: 8px 12px;
		color: #fff;
		background: rgb(0 0 0 / 70%);
		border-radius: 4px;
	}

	&__controls {
		display: flex;
		gap: 12px;
		margin-bottom: 8px;
	}

	&__container {
		max-width: 100%;
		outline: 1px dashed var(--vc-border-color, #ccc);
	}

	&__bar {
		padding: 8px 12px;
		line-height: 20px;
		color: #fff;
		background: var(--vc-color-primary, #2d8cf0);

		&.is-bottom {
			background: var(--vc-color-success, #19be6b);
		}
	}

	&__rows p {
		margin: 0;
		line-height: 32px;
	}

	&__readout {
		margin: 0;
		font-size: 12px;
		line-height: 18px;
	}
}
</style>
