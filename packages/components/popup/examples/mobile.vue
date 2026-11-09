<template>
	<div class="vcm-popup-example">
		<MList header="弹出位置">
			<MListItem
				v-for="item in placements"
				:key="item"
				:label="item"
				@click="handleOpen(item)"
			/>
		</MList>

		<MList header="标题与内容">
			<MListItem label="title + content + closable" @click="isStructured = true" />
			<MListItem label="长内容（内容区滚动，标题栏与底部固定）" @click="isLong = true" />
			<MListItem label="MPopup.open" @click="handlePortal" />
		</MList>

		<MList header="面板外观">
			<MListItem label="theme" :extra="theme" @click="handleTheme" />
		</MList>

		<p class="vcm-popup-example__message">{{ message }}</p>

		<!-- placement 可在运行时切换，同一个实例即可 -->
		<MPopup v-model="isVisible" :placement="placement" :theme="theme">
			<div :class="['vcm-popup-example__panel', `is-${placement}`]">
				placement: {{ placement }}
			</div>
		</MPopup>

		<MPopup
			v-model="isStructured"
			title="标题"
			content="内容区的文字，点击遮罩或右上角关闭。"
			closable
			@visible-change="handleVisibleChange"
		/>

		<MPopup v-model="isLong" title="长内容" closable>
			<div v-for="item in 30" :key="item" style="line-height: 2;">第 {{ item }} 行</div>
			<template #footer>
				<MButton type="primary" long @click="isLong = false">完成</MButton>
			</template>
		</MPopup>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup } from '../index.m';
import { MButton } from '../../button/index.m';
import { MList, MListItem } from '../../list/index.m';

const placements = ['bottom', 'top', 'left', 'right', 'center'];
const themes = ['light', 'dark', 'none'];
const placement = ref('bottom');
const theme = ref('light');
const isVisible = ref(false);
const isStructured = ref(false);
const isLong = ref(false);
const message = ref('');

const handleOpen = (v) => {
	placement.value = v;
	isVisible.value = true;
};

const handleTheme = () => {
	theme.value = themes[(themes.indexOf(theme.value) + 1) % themes.length];
};

const handleVisibleChange = (v) => {
	message.value = `visible-change: ${v}`;
};

const handlePortal = () => {
	MPopup.open({
		title: 'MPopup.open',
		content: '以 Portal 打开，onClose 在离场动画结束后触发。',
		closable: true,
		onClose: () => {
			message.value = 'MPopup.open 已关闭';
		}
	});
};
</script>
<style lang="scss">
.vcm-popup-example {
	min-height: 100vh;
	padding: 12px 0;
	background: var(--vc-background-color-light);

	&__message {
		padding: 0 16px;
		color: var(--vc-color-dark-lighter);
	}

	&__panel {
		display: flex;
		padding: 16px;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;

		&.is-bottom, &.is-top {
			height: 200px;
		}

		&.is-left, &.is-right {
			width: 240px;
			height: 100%;
		}

		&.is-center {
			width: 240px;
			height: 160px;
		}
	}
}
</style>
