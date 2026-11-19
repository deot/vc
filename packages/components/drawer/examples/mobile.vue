<template>
	<div class="vcm-drawer-example">
		<MList header="弹出位置">
			<MListItem
				v-for="item in placements"
				:key="item"
				:label="item"
				:extra="item === 'left' || item === 'right' ? '宽 600（80%）' : '高度随内容'"
				@click="handleOpen(item)"
			/>
		</MList>

		<MList header="确认与取消">
			<MListItem label="表单：onOk 异步提交" @click="isForm = true" />
			<MListItem label="closeWithCancel：关闭前确认" @click="isGuarded = true" />
			<MListItem label="footer=false，长内容" @click="isLong = true" />
			<MListItem label="MDrawer.open" @click="handlePortal" />
		</MList>

		<p class="vcm-drawer-example__message">{{ message }}</p>

		<!-- placement 可在运行时切换，同一个实例即可 -->
		<MDrawer
			v-model="isVisible"
			:placement="placement"
			:title="`placement: ${placement}`"
			content="点击遮罩、右上角或沿弹出方向滑动关闭。"
			@ok="log('ok')"
			@cancel="log('cancel')"
		/>

		<MDrawer
			v-model="isForm"
			title="填写信息"
			placement="bottom"
			:ok-disabled="!form.name"
			:on-ok="handleSubmit"
		>
			<MForm :model="form" :label-width="160">
				<MFormItem label="名称" prop="name">
					<MInput v-model="form.name" placeholder="填写后可提交" clearable />
				</MFormItem>
				<MFormItem label="备注" prop="remark">
					<MInput v-model="form.remark" placeholder="选填" clearable />
				</MFormItem>
			</MForm>
			<template #footer-extra>
				<span v-if="isSubmitting" class="vcm-drawer-example__hint">提交中…</span>
			</template>
		</MDrawer>

		<MDrawer
			v-model="isGuarded"
			title="未保存的修改"
			content="点击遮罩、右上角、取消或滑动关闭时，都会先经过 onCancel。"
			placement="right"
			:on-cancel="handleGuard"
		/>

		<MDrawer
			v-model="isLong"
			title="长内容"
			placement="bottom"
			:footer="false"
		>
			<div v-for="item in 30" :key="item" style="line-height: 2;">第 {{ item }} 行</div>
		</MDrawer>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { MDrawer } from '../index.m';
import { MForm, MFormItem } from '../../form/index.m';
import { MInput } from '../../input/index.m';
import { MList, MListItem } from '../../list/index.m';
import { MModal } from '../../modal/index.m';
import { MToast } from '../../toast/index.m';

const placements = ['bottom', 'top', 'left', 'right'];
const placement = ref('bottom');
const isVisible = ref(false);
const isForm = ref(false);
const isGuarded = ref(false);
const isLong = ref(false);
const isSubmitting = ref(false);
const message = ref('');
const form = reactive({ name: '', remark: '' });

// 回调返回其它真值会阻止关闭，这里不返回值
const log = (v) => {
	message.value = v;
};

const handleOpen = (v) => {
	placement.value = v;
	isVisible.value = true;
};

// 返回 Promise：兑现后关闭，拒绝时保持打开
const handleSubmit = () => {
	isSubmitting.value = true;
	return new Promise((resolve) => {
		setTimeout(() => {
			isSubmitting.value = false;
			MToast.info(`已提交：${form.name}`);
			resolve();
		}, 800);
	});
};

const handleGuard = () => new Promise((resolve, reject) => {
	MModal.alert({
		title: '放弃修改？',
		content: '关闭后修改不会保存。',
		onOk: () => {
			message.value = '已放弃修改';
			resolve();
		},
		onCancel: () => {
			message.value = '继续编辑';
			reject();
		}
	});
});

const handlePortal = () => {
	MDrawer.open({
		title: 'MDrawer.open',
		content: '以 Portal 打开，onClose 在离场动画结束后触发。',
		onOk: () => {
			message.value = 'MDrawer.open：ok';
		},
		onClose: () => {
			message.value += '（已关闭）';
		}
	});
};
</script>
<style lang="scss">
.vcm-drawer-example {
	min-height: 100vh;
	padding: 12px 0;
	background: var(--vc-background-color-light);

	&__message {
		padding: 0 16px;
		color: var(--vc-color-dark-lighter);
	}

	&__hint {
		font-size: 14px;
		color: var(--vc-color-dark-lighter);
	}
}
</style>
