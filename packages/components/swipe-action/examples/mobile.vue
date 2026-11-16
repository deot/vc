<template>
	<div class="m-swipe-action-demo">
		<MList header="基础用法：向左滑出右侧按钮">
			<MListItem label="标题" extra="内容" :swipe-action-options="{ rightActions: baseActions }" @click="log('点击列表项')" />
			<MListItem label="标题" description="描述文字" :swipe-action-options="{ rightActions: baseActions }" />
		</MList>

		<MList header="左右都有、图标与颜色">
			<MListItem
				label="向左或向右滑动"
				:arrow="false"
				:swipe-action-options="{
					leftActions: [
						{ content: '置顶', type: 'primary', icon: 'back-top' },
						{ content: '已读', type: 'success' }
					],
					rightActions: [
						{ content: '收藏', icon: 'star', style: { background: '#FFB400' } },
						{ content: '稍后', type: 'warning', disabled: true },
						{ content: '删除', type: 'error', icon: 'delete' }
					]
				}"
			/>
		</MList>

		<MList header="二次确认与全滑删除" footer="删除先弹窗确认（取消则保持展开）；向左滑过一半松手直接删除">
			<MListItem
				v-for="item in rows"
				:key="item.id"
				:label="item.label"
				:arrow="false"
				:swipe-action-options="{
					rightActions: [
						{ content: '标记', onClick: () => log(`标记 ${item.label}`) },
						{ content: '删除', type: 'error', fullSwipe: true, onClick: () => confirmRemove(item) }
					]
				}"
			/>
			<MListItem v-if="!rows.length" label="已全部删除" extra="重置" @click="reset" />
		</MList>

		<MList header="v-model:swiped">
			<MListItem
				v-model:swiped="swiped"
				label="当前状态"
				:extra="String(swiped)"
				:arrow="false"
				:swipe-action-options="{
					leftActions: [{ content: '左侧', type: 'primary' }],
					rightActions: [{ content: '右侧', type: 'error' }]
				}"
			/>
			<MListItem label="打开左侧" @click="swiped = 'left'" />
			<MListItem label="打开右侧" @click="swiped = 'right'" />
			<MListItem label="收起" @click="swiped = false" />
		</MList>

		<div class="m-swipe-action-demo__title">
			独立使用 MSwipeAction（任意内容）
		</div>
		<MSwipeAction
			class="m-swipe-action-demo__card"
			:right-actions="[{ content: '归档', type: 'primary' }, { content: '删除', type: 'error' }]"
			:close-on-click-outside="false"
		>
			<div class="m-swipe-action-demo__card-content">
				<strong>卡片标题</strong>
				<p>点击外部不会收起（closeOnClickOutside 为 false），点内容区收起</p>
			</div>
		</MSwipeAction>

		<div class="m-swipe-action-demo__title">
			禁用
		</div>
		<MSwipeAction disabled :right-actions="baseActions">
			<div class="m-swipe-action-demo__card-content">
				disabled 时不响应滑动
			</div>
		</MSwipeAction>

		<div class="m-swipe-action-demo__log">
			{{ message }}
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '../../list/index.m';
import { MModal } from '../../modal/index.m';
import { MSwipeAction } from '../index.m';

const message = ref('操作记录');
const log = (value) => {
	message.value = value;
};

const baseActions = [
	{ content: '置顶', onClick: () => log('置顶') },
	{ content: '删除', type: 'error', onClick: () => log('删除') }
];

const createRows = () => Array.from({ length: 4 }, (_, index) => ({ id: index, label: `列表项 ${index + 1}` }));
const rows = ref(createRows());
const reset = () => {
	rows.value = createRows();
};

const remove = (item) => {
	rows.value = rows.value.filter(row => row !== item);
	log(`已删除 ${item.label}`);
};

// 全滑与点击共用：返回 Promise，确定后删除并收起，取消则保持展开
const confirmRemove = (item) => {
	return new Promise((resolve, reject) => {
		MModal.alert({
			title: `删除${item.label}？`,
			onOk: () => {
				remove(item);
				resolve();
			},
			onCancel: () => reject()
		});
	});
};

const swiped = ref(false);
</script>

<style lang="scss">
.m-swipe-action-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__card {
		margin: 0 calc(var(--vc-rem) * 32);
		border-radius: calc(var(--vc-rem) * 16);
	}

	&__card-content {
		padding: calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-light);
		background: var(--vc-background-color-lightest);

		p {
			margin: calc(var(--vc-rem) * 8) 0 0;
			color: var(--vc-color-dark-extralight);
		}
	}

	&__log {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}
}
</style>
