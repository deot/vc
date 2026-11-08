<template>
	<div class="m-popover-demo">
		<h3>浅色 / 深色</h3>
		<p class="m-popover-demo__tip">
			点按打开，点外部关闭；字号与间距随 --vc-rem 缩放
		</p>
		<div class="m-popover-demo__row">
			<MPopover content="浅色气泡" placement="top">
				<MButton size="small">
					浅色
				</MButton>
			</MPopover>
			<MPopover content="深色气泡" placement="top" theme="dark">
				<MButton size="small">
					深色
				</MButton>
			</MPopover>
			<MPopover placement="top" theme="dark">
				<MButton size="small">
					多行
				</MButton>
				<template #content>
					<div class="m-popover-demo__text">
						文字较长时在可用宽度内换行，行高与字号一起缩放
					</div>
				</template>
			</MPopover>
		</div>

		<h3>方向</h3>
		<div class="m-popover-demo__grid">
			<MPopover
				v-for="placement in placements"
				:key="placement"
				:placement="placement"
				:content="placement"
			>
				<MButton size="mini" class="m-popover-demo__cell">
					{{ placement }}
				</MButton>
			</MPopover>
		</div>

		<h3>header / footer 与长内容滚动</h3>
		<div class="m-popover-demo__row">
			<MPopover v-model="isVisible" placement="bottom" :scroller-options="{ maxHeight: 'calc(var(--vc-rem) * 400)' }">
				<MButton size="small">
					{{ isVisible ? '已打开' : '打开' }}
				</MButton>
				<template #header>
					<div class="m-popover-demo__title">
						标题
					</div>
				</template>
				<template #content>
					<div class="m-popover-demo__list">
						<div v-for="i in 12" :key="i">
							第 {{ i }} 行内容
						</div>
					</div>
				</template>
				<template #footer>
					<div class="m-popover-demo__footer">
						<MButton size="mini" @click="isVisible = false">
							关闭
						</MButton>
					</div>
				</template>
			</MPopover>
		</div>

		<h3>MPopover.open</h3>
		<div class="m-popover-demo__row">
			<MButton size="small" @click="handleOpen">
				调用 MPopover.open
			</MButton>
		</div>
	</div>
</template>
<script setup>
import { ref, onUnmounted } from 'vue';
import { MPopover } from '../index.m';
import { MButton } from '../../button/index.m';

const placements = [
	'top-left', 'top', 'top-right',
	'bottom-left', 'bottom', 'bottom-right'
];

const isVisible = ref(false);

let leaf;
const handleOpen = (e) => {
	leaf?.destroy();
	leaf = MPopover.open({
		triggerElement: e.currentTarget,
		placement: 'bottom',
		content: '点外部关闭'
	});
};

onUnmounted(() => leaf?.destroy());
</script>
<style scoped>
.m-popover-demo {
	padding: 16px;
}

.m-popover-demo__tip {
	margin-bottom: 12px;
	font-size: calc(var(--vc-rem) * 24);
	color: var(--vc-color-dark-extralight);
}

.m-popover-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: calc(var(--vc-rem) * 32);
	margin-bottom: 16px;
}

.m-popover-demo__grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: calc(var(--vc-rem) * 24);
	margin-bottom: 16px;
}

.m-popover-demo__cell {
	width: 100%;
}

.m-popover-demo__text {
	width: calc(var(--vc-rem) * 320);
}

.m-popover-demo__title {
	font-weight: 600;
}

.m-popover-demo__list {
	width: calc(var(--vc-rem) * 320);
}

.m-popover-demo__footer {
	display: flex;
	justify-content: flex-end;
}
</style>
