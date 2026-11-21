<template>
	<div class="m-notice-demo">
		<h3>状态</h3>
		<div class="m-notice-demo__actions">
			<MButton v-for="item in modes" :key="item.method" @click="handleOpen(item)">
				{{ item.label }}
			</MButton>
		</div>

		<h3>标题 + 正文 / 不可关闭</h3>
		<div class="m-notice-demo__actions">
			<MButton @click="handleTitle">
				标题 + 正文
			</MButton>
			<MButton @click="handleNoClose">
				不可关闭（上滑关闭）
			</MButton>
		</div>

		<h3>加载后更新</h3>
		<div class="m-notice-demo__actions">
			<MButton @click="handleLoading">
				开始加载
			</MButton>
		</div>

		<h3>放在导航栏下方（top: 88）</h3>
		<div class="m-notice-demo__actions">
			<MButton @click="handleOffset">
				导航栏下方
			</MButton>
			<MButton @click="handleDestroy">
				清空
			</MButton>
		</div>

		<h3>页面内（fixed: false）</h3>
		<MNotice :fixed="false" :duration="0" :closable="false" mode="warning" content="页面内的通知横幅" />

		<p v-for="item in 20" :key="item" class="m-notice-demo__line">
			页面内容第 {{ item }} 行：通知显示与离场时页面不会移动。
		</p>
	</div>
</template>

<script setup>
import { MNotice } from '../index.m';
import { MButton } from '../../button/index.m';

const modes = [
	{ method: 'open', label: '无状态', content: '这是一条普通通知' },
	{ method: 'info', label: '信息', content: '你有一条新的系统消息' },
	{ method: 'success', label: '成功', content: '文件已保存' },
	{ method: 'warning', label: '警告', content: '请检查尚未完成的操作' },
	{ method: 'error', label: '错误', content: '网络不可用，请检查网络设置' }
];

// 静态方法返回可 then 的对象，包一层避免按钮进入加载状态
const handleOpen = (item) => {
	MNotice[item.method]({ content: item.content });
};

const handleTitle = () => {
	MNotice.success({ title: '提交成功', content: '审核结果将通过消息通知你' });
};

const handleNoClose = () => {
	MNotice.warning({ content: '向上滑动可关闭这条通知', closable: false, duration: 0 });
};

const handleLoading = () => {
	const leaf = MNotice.loading({ content: '正在同步…' });
	setTimeout(() => {
		leaf.wrapper?.setMode('success');
		leaf.wrapper?.setContent('同步完成');
		leaf.wrapper?.setDuration(2000);
	}, 1500);
};

const handleOffset = () => {
	MNotice.info({ content: '这条通知位于导航栏下方', top: 88 });
};

const handleDestroy = () => {
	MNotice.destroy();
};
</script>

<style scoped>
.m-notice-demo {
	padding: 0 16px 32px;
}

.m-notice-demo h3 {
	margin: 20px 0 12px;
}

.m-notice-demo__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.m-notice-demo__line {
	margin: 12px 0 0;
	font-size: 14px;
	color: var(--vc-color-dark-lighter);
}
</style>
