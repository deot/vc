<template>
	<div class="m-toast-demo">
		<h3>状态（success / warning / error 带图标）</h3>
		<div class="m-toast-demo__row">
			<MButton size="small" @click="show('info', '这是一条提示')">
				info
			</MButton>
			<MButton size="small" @click="show('success', '保存成功')">
				success
			</MButton>
			<MButton size="small" @click="show('warning', '内容未填写完整')">
				warning
			</MButton>
			<MButton size="small" @click="show('error', '提交失败，请重试')">
				error
			</MButton>
		</div>

		<h3>加载</h3>
		<div class="m-toast-demo__row">
			<MButton size="small" @click="handleLoading">
				加载 1.5 秒后成功
			</MButton>
			<MButton size="small" @click="handleIconOnly">
				只有加载图标（3 秒后销毁）
			</MButton>
		</div>

		<h3>位置</h3>
		<div class="m-toast-demo__row">
			<MButton size="small" @click="show('info', { content: '顶部提示', placement: 'top' })">
				top
			</MButton>
			<MButton size="small" @click="show('info', { content: '居中提示', placement: 'center' })">
				center
			</MButton>
			<MButton size="small" @click="show('info', { content: '底部提示', placement: 'bottom' })">
				bottom
			</MButton>
		</div>

		<h3>不带遮罩、多条同时显示、长文字</h3>
		<div class="m-toast-demo__row">
			<MButton size="small" @click="show('info', { content: '不遮挡页面，可继续点击', mask: false })">
				mask: false
			</MButton>
			<MButton size="small" @click="handleMultiple">
				三条同时显示
			</MButton>
			<MButton size="small" @click="show('info', longText)">
				长文字
			</MButton>
			<MButton size="small" @click="show('info', '第一行\n第二行')">
				换行
			</MButton>
		</div>
		<p class="m-toast-demo__status">
			点击次数：{{ count }}
			<MButton size="mini" @click="count++">
				+1
			</MButton>
		</p>
	</div>
</template>
<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { MToast } from '../index.m';
import { MButton } from '../../button/index.m';

const count = ref(0);
const longText = '这是一段较长的提示文字，用来查看左右安全边距和自动换行的效果，提示最多铺满到屏幕两侧各留出一段间距';

// 静态方法返回的实例可 then，直接写在 @click 里会被 MButton 当作异步任务显示加载，这里不返回它
const show = (mode, ...args) => {
	MToast[mode](...args);
};

const handleLoading = () => {
	const toast = MToast.loading('加载中…');
	setTimeout(() => {
		toast.destroy();
		MToast.success('加载完成', 1500);
	}, 1500);
};

const handleMultiple = () => {
	MToast.info({ content: '顶部', placement: 'top', mask: false });
	MToast.success({ content: '居中', mask: false });
	MToast.error({ content: '底部', placement: 'bottom', mask: false });
};

let timer;
const handleIconOnly = () => {
	const toast = MToast.loading();
	clearTimeout(timer);
	timer = setTimeout(() => toast.destroy(), 3000);
};

onBeforeUnmount(() => {
	clearTimeout(timer);
	MToast.destroy();
});
</script>
<style scoped>
.m-toast-demo { padding: 16px; }
.m-toast-demo h3 { margin: 20px 0 12px; font-size: 14px; font-weight: 500; color: var(--vc-color-dark-light); }
.m-toast-demo h3:first-child { margin-top: 0; }
.m-toast-demo__row { display: flex; flex-wrap: wrap; gap: 8px; }
.m-toast-demo__status { display: flex; margin: 20px 0 0; gap: 8px; align-items: center; }
</style>
