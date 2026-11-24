<template>
	<div class="vcm-input-plaintext-demo">
		<h3>编辑</h3>
		<MForm :model="model" label-width="auto">
			<MFormItem label="文字">
				<MInput v-model="model.text" />
			</MFormItem>
			<MFormItem label="数量">
				<MInputNumber v-model="model.amount" />
			</MFormItem>
			<MFormItem label="备注">
				<MTextarea v-model="model.multiline" />
			</MFormItem>
		</MForm>

		<h3>详情（plaintext）</h3>
		<MList>
			<MListItem :arrow="false" label="文字">
				<template #extra>
					<MInput v-model="model.text" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="数量">
				<template #extra>
					<MInputNumber v-model="model.amount" plaintext>
						<template #append>
							件
						</template>
					</MInputNumber>
				</template>
			</MListItem>
			<MListItem :arrow="false" label="备注">
				<template #extra>
					<MTextarea v-model="model.multiline" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="空值 + extra">
				<template #extra>
					<MInput v-model="model.empty" plaintext extra="-" />
				</template>
			</MListItem>
		</MList>
	</div>
</template>

<script setup>
import { reactive } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MList, MListItem } from '../../list/index.m';
import { MTextarea } from '../../textarea/index.m';
import { MInput, MInputNumber } from '../index.m';

const model = reactive({
	text: '一段文字',
	amount: 3,
	multiline: '第一行\n第二行',
	empty: ''
});
</script>

<style lang="scss">
.vcm-input-plaintext-demo {
	h3 {
		padding: 16px 16px 8px;
		font-size: 14px;
		color: #999;
	}
}
</style>
