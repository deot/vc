<template>
	<div>
		<MPopup
			v-for="(item, index) in placements"
			:key="`popup__${item}`"
			v-model="visibles[index]"
			:placement="item"
		>
			<MForm>
				<MFormItem>
					<MInput v-model="value" type="text" clearable />
				</MFormItem>
				<MFormItem>
					<MInput v-model="value" type="text" clearable />
				</MFormItem>
				<MFormItem>
					<MInput v-model="value" type="text" clearable />
				</MFormItem>
				<MFormItem>
					<MInput v-model="value" type="text" clearable />
				</MFormItem>
			</MForm>
			{{ item }}
		</MPopup>

		<MButton
			v-for="(item, index) in placements"
			:key="`button__${item}`"
			:placement="item"
			@click="handleNormal(item, index)"
		>
			normal: {{ item }} {{ visibles[index] }}
		</MButton>

		<MButton
			v-for="(item, index) in placements"
			:key="`portal__${item}`"
			:placement="item"
			@click="handlePortal(item, index)"
		>
			portal: {{ item }}
		</MButton>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<div>2222</div>
	</div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import * as Device from '@deot/helper-device';
import { Tip } from './popup';
import { MPopup } from '../index.m';
import { MButton } from '../../button/index.m';
import { MInput } from '../../input/index.m';
import { MForm, MFormItem } from '../../form/index.m';

const value = ref('');
const placements = ref(['top', 'bottom', 'center', 'left', 'right']);
const visibles = ref([false, false, false, false, false]);

const handleNormal = (_, index) => {
	visibles.value.splice(index, 0, !visibles.value[index]);
};

const handlePortal = async (placement) => {
	await Tip.popup({ placement });
	console.log('success');
};

onMounted(() => {
	// hack for wechat, 测试弹层下输入框
	if (!Device.ios
		|| !Device.wechat
		|| !Device.wechatVersion >= '6.7.4'
	) return;

	const handleFn = (e) => {
		document.body.scrollTop = document.body.scrollTop + 0;
		e.target.removeEventListener('blur', handleFn);
	};

	document.addEventListener('click', (e) => {
		const tag = e.target.nodeName.toLowerCase();
		if (!/^(input|textarea)$/.test(tag)) return;
		e.target.addEventListener('blur', handleFn);
	}, true);
});
</script>
