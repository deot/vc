<template>
	<div class="vcm-color-picker-basic">
		<MForm ref="form" :model="model" label-width="auto">
			<MFormItem prop="basic" label="确定后提交" required="请选择颜色">
				<MColorPicker v-model="model.basic" title="选择颜色" />
			</MFormItem>
			<MFormItem prop="alpha" label="透明度">
				<MColorPicker v-model="model.alpha" title="选择颜色" alpha format="rgb" />
			</MFormItem>
			<MFormItem prop="instant" label="选色即提交">
				<MColorPicker v-model="model.instant" title="选择颜色" :confirm="false" colors />
			</MFormItem>
			<MFormItem prop="bottom" label="底部按钮">
				<MColorPicker v-model="model.bottom" title="选择颜色" confirm="bottom" colors />
			</MFormItem>
			<MFormItem prop="presets" label="只用预设色">
				<MColorPicker
					v-model="model.presets"
					title="选择颜色"
					:panel="false"
					:hue="false"
					:editable="false"
					:confirm="false"
					:colors="presets"
				/>
			</MFormItem>
			<MFormItem prop="disabled" label="禁用">
				<MColorPicker v-model="model.disabled" disabled />
			</MFormItem>
			<MFormItem prop="trigger" label="自定义触发区">
				<MColorPicker v-model="model.trigger" title="选择颜色">
					<template #default="{ value, color }">
						<div class="vcm-color-picker-basic__trigger">
							<span :style="{ background: color || 'transparent' }" />
							{{ value || '点击选择' }}
						</div>
					</template>
				</MColorPicker>
			</MFormItem>
		</MForm>
		<div class="vcm-color-picker-basic__actions">
			<MButton type="primary" @click="handleValidate">
				提交
			</MButton>
		</div>
		<div class="vcm-color-picker-basic__actions">
			<MButton @click="handleOpen(true)">
				open
			</MButton>
			<MButton @click="handleOpen(false)">
				open 即提交
			</MButton>
			<MButton @click="handleOpen('bottom')">
				open bottom
			</MButton>
		</div>
		<div class="vcm-color-picker-basic__title">
			内嵌视图
		</div>
		<MColorPicker.View v-model="model.view" class="vcm-color-picker-basic__view" alpha colors />
		<div v-for="(v, key) in { ...model, opened }" :key="key" class="vcm-color-picker-basic__output">
			<span>{{ key }}</span>
			<code>{{ JSON.stringify(v) }}</code>
		</div>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MButton } from '../../button/index.m';
import { MToast } from '../../toast/index.m';
import { MColorPicker } from '../index.m';

const presets = ['#5495F6', '#26BE76', '#FFBF00', '#F5222D', '#6600FF', '#FF0066', '#444444', '#FFFFFF'];

const form = ref(null);
const model = reactive({
	basic: '',
	alpha: 'rgba(84, 149, 246, 0.6)',
	instant: '#26BE76',
	bottom: '',
	presets: '#5495F6',
	disabled: '#FFBF00',
	trigger: '',
	view: '#5495F6'
});
const opened = ref('');

const handleValidate = async () => {
	try {
		await form.value.validate();
		MToast.info('校验通过');
	} catch (e) {
		console.log(e);
	}
};

const handleOpen = (confirm) => {
	MColorPicker.open({
		value: opened.value,
		confirm,
		colors: true,
		title: '直接调用',
		onOk: (v) => {
			opened.value = v;
		},
		onChange: (v) => {
			opened.value = v;
		}
	});
};
</script>

<style lang="scss">
.vcm-color-picker-basic {
	&__actions {
		display: flex;
		padding: 12px 16px;
		gap: 12px;

		> * {
			flex: 1;
		}
	}

	&__title {
		padding: 16px 16px 8px;
		font-size: 13px;
		color: var(--vc-color-dark-extralight);
	}

	&__view {
		padding: 12px 16px 16px;
	}

	&__output {
		display: grid;
		padding: 6px 12px 10px;
		font-size: 13px;
		border-bottom: 1px solid #eee;
		grid-template-columns: 110px minmax(0, 1fr);
		gap: 8px;

		code {
			word-break: break-all;
			white-space: pre-wrap;
		}
	}

	&__trigger {
		display: flex;
		font-size: 14px;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;

		span {
			width: 16px;
			height: 16px;
			border: 1px solid #ddd;
			border-radius: 50%;
		}
	}
}
</style>
