<template>
	<div class="vcm-modal-example">
		<MList header="组件用法（v-model）">
			<MListItem label="标题 + 内容" @click="isBasic = true" />
			<MListItem label="只有标题" @click="isTitleOnly = true" />
			<MListItem label="只有内容" @click="isContentOnly = true" />
			<MListItem label="一个按钮" @click="isAlone = true" />
			<MListItem label="正文左对齐（contentStyle）" @click="isLeft = true" />
			<MListItem label="自定义内容（默认插槽）" @click="isSlot = true" />
		</MList>

		<MList header="方法调用（MModal.alert / operation）">
			<MListItem label="确定后等待 Promise 结束再关闭" @click="handleAsync" />
			<MListItem label="三个按钮（竖排）" @click="handleColumn" />
			<MListItem label="按钮禁用（disabled）" @click="handleDisabled" />
			<MListItem label="操作列表（operation）" @click="handleOperation" />
		</MList>

		<p class="vcm-modal-example__message">{{ message }}</p>

		<MModalView
			v-model="isBasic"
			title="标题文字"
			content="这里是一段说明文字，默认居中显示，超过一行时自动换行。"
			@ok="log('ok')"
			@cancel="log('cancel')"
			@close="log('close')"
		/>
		<MModalView
			v-model="isTitleOnly"
			title="这里是一段较长的标题文字，没有内容时上下留白相同"
			@ok="log('ok')"
		/>
		<MModalView
			v-model="isContentOnly"
			content="没有标题时，正文作为主文字显示。"
			@ok="log('ok')"
		/>
		<MModalView
			v-model="isAlone"
			title="标题文字"
			content="只有一个按钮时为主色。"
			:cancel-text="false"
			ok-text="知道了"
			@ok="log('ok')"
		/>
		<MModalView
			v-model="isLeft"
			title="标题文字"
			content-style="text-align: left"
			content="较长的说明文字适合左对齐：这里是第一句说明，这里是第二句说明，这里是第三句说明，这里是第四句说明。"
			@ok="log('ok')"
		/>
		<MModalView v-model="isSlot" title="标题文字" @ok="log('ok')">
			<div class="vcm-modal-example__slot">
				<span>选项一</span>
				<span>选项二</span>
			</div>
		</MModalView>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MModal, MModalView } from '../index.m';
import { MList, MListItem } from '../../list/index.m';

const isBasic = ref(false);
const isTitleOnly = ref(false);
const isContentOnly = ref(false);
const isAlone = ref(false);
const isLeft = ref(false);
const isSlot = ref(false);
const message = ref('');

const log = (v) => {
	message.value = v;
};

const handleAsync = () => {
	MModal.alert({
		title: '标题文字',
		content: '点击确定后等待 1 秒再关闭。',
		onOk: () => {
			log('ok: 等待中');
			return new Promise((resolve) => {
				setTimeout(() => {
					log('ok: 已关闭');
					resolve();
				}, 1000);
			});
		},
		onCancel: () => log('cancel'),
		onClose: () => log('close')
	});
};

const handleColumn = () => {
	MModal.alert({
		title: '标题文字',
		content: '三个及以上按钮时竖向排列。',
		data: [
			{ content: '选项一', onClick: () => log('选项一') },
			{ content: '选项二', onClick: () => log('选项二') },
			{ content: '选项三', onClick: () => log('选项三') }
		]
	});
};

const handleDisabled = () => {
	MModal.alert({
		title: '标题文字',
		content: '禁用的按钮置灰，点击既不触发回调也不关闭。',
		data: [
			{ content: '取消', onClick: () => log('取消') },
			{ content: '确定', disabled: true, onClick: () => log('确定') }
		]
	});
};

const handleOperation = () => {
	MModal.operation({
		data: [
			{ content: '选项一', onClick: () => log('选项一') },
			{ content: '选项二', onClick: () => log('选项二') },
			{ content: '选项三（禁用）', disabled: true, onClick: () => log('选项三') }
		]
	});
};
</script>
<style lang="scss">
.vcm-modal-example {
	&__message {
		padding: 0 16px;
		font-size: 12px;
		color: #909399;
	}

	&__slot {
		display: flex;
		justify-content: space-around;
	}
}
</style>
