<template>
	<div class="popconfirm-demo">
		<div class="popconfirm-demo__actions">
			<Button @click="handleLocale">切换语言：{{ localeName }}</Button>
			<Button @click="handleTheme">切换主题：{{ isDark ? '暗色' : '亮色' }}</Button>
		</div>
		<div class="popconfirm-demo__actions">
			<Popconfirm
				v-for="type in types"
				:key="type"
				:type="type"
				placement="bottom"
				:outside-clickable="false"
				:title="`${type} 确认框`"
				content="点击确定后等待一秒完成。"
				@ok="handleOk"
				@cancel="handleCancel"
			>
				<Button>{{ type }}</Button>
			</Popconfirm>
			<Popconfirm title="自定义按钮文案" ok-text="Yes" cancel-text="No">
				<Button>自定义文案</Button>
			</Popconfirm>
		</div>
		<div class="popconfirm-demo__actions">
			<Popconfirm v-model="isVisible" trigger="custom" :outside-clickable="false" title="外部控制显隐">
				<Button @click="handleToggle">受控确认框</Button>
			</Popconfirm>
			<span>状态：{{ isVisible ? '打开' : '关闭' }}</span>
		</div>
		<p>{{ result }}</p>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { zhCN, enUS } from '@deot/vc-locale';
import { Popconfirm } from '..';
import { Button } from '../../button/index';
import { VcInstance } from '../../vc';

const types = ['warning', 'info', 'success', 'error'];
const isVisible = ref(false);
const isDark = ref(false);
const localeName = ref(VcInstance.options.locale.name);
const result = ref('等待操作');
const originalLocale = VcInstance.options.locale;
const originalTheme = document.body.getAttribute('data-vc-theme');

const handleLocale = () => {
	const locale = localeName.value === 'zh-CN' ? enUS : zhCN;
	localeName.value = locale.name;
	VcInstance.configure({ locale });
};
const handleTheme = () => {
	isDark.value = !isDark.value;
	document.body.setAttribute('data-vc-theme', isDark.value ? 'dark' : 'light');
};
const handleToggle = () => {
	isVisible.value = !isVisible.value;
};
const handleCancel = () => {
	result.value = '已取消';
};
const handleOk = () => {
	result.value = '提交中…';
	return new Promise((resolve) => {
		setTimeout(() => {
			result.value = '已完成';
			resolve();
		}, 1000);
	});
};

onMounted(() => document.body.setAttribute('data-vc-theme', 'light'));
onUnmounted(() => {
	VcInstance.configure({ locale: originalLocale });
	originalTheme === null
		? document.body.removeAttribute('data-vc-theme')
		: document.body.setAttribute('data-vc-theme', originalTheme);
});
</script>

<style scoped>
.popconfirm-demo {
	display: grid;
	gap: 24px;
	padding: 160px 24px 48px;
	color: var(--vc-foreground-color);
	background: var(--vc-background-color);
	min-height: 100vh;
	box-sizing: border-box;
	align-content: start;
}

.popconfirm-demo__actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
}

.popconfirm-demo__actions:first-child {
	margin-bottom: 144px;
}

.popconfirm-demo p { margin: 0; }
</style>
