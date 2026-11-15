<template>
	<div class="m-steps-demo">
		<div class="m-steps-demo__title">
			基础用法（文字默认在节点下方，375 宽下节点 18、标题 14）
		</div>
		<div class="m-steps-demo__card">
			<MSteps v-model="current" clickable>
				<MStep title="已完成" />
				<MStep title="进行中" />
				<MStep title="未开始" />
			</MSteps>
			<div class="m-steps-demo__toolbar">
				<MButton size="small" :disabled="current <= 0" @click="current--">
					上一步
				</MButton>
				<MButton size="small" :disabled="current >= 4" @click="current++">
					下一步
				</MButton>
				<span>当前：{{ current }}（clickable，可点按切换）</span>
			</div>
		</div>

		<div class="m-steps-demo__title">
			描述、失败状态
		</div>
		<div class="m-steps-demo__card">
			<MSteps :model-value="2" status="error">
				<MStep title="提交申请" description="09-01 10:00" />
				<MStep title="审核失败" description="资料不完整" />
				<MStep title="完成" description="等待中" />
			</MSteps>
		</div>

		<div class="m-steps-demo__title">
			窄列内的长标题换行
		</div>
		<div class="m-steps-demo__card">
			<MSteps :model-value="2">
				<MStep title="较长的步骤标题" />
				<MStep title="第二个步骤标题较长" />
				<MStep title="短标题" />
				<MStep title="最后一步" />
			</MSteps>
		</div>

		<div class="m-steps-demo__title">
			圆点（未开始灰环、已完成主色环、当前实心）
		</div>
		<div class="m-steps-demo__card">
			<MSteps v-model="current" type="dot">
				<MStep title="已完成" description="描述文字" />
				<MStep title="进行中" description="描述文字" />
				<MStep title="未开始" description="描述文字" />
			</MSteps>
		</div>

		<div class="m-steps-demo__title">
			纵向
		</div>
		<div class="m-steps-demo__card">
			<MSteps :model-value="2" vertical>
				<MStep title="已下单" description="09-01 10:00" />
				<MStep title="运输中" :description="text" />
				<MStep title="待签收" description="预计 09-03 送达" />
			</MSteps>
		</div>

		<div class="m-steps-demo__title">
			纵向圆点
		</div>
		<div class="m-steps-demo__card">
			<MSteps :model-value="2" vertical type="dot">
				<MStep title="已下单" description="09-01 10:00" />
				<MStep title="运输中" :description="text" />
				<MStep title="待签收" description="预计 09-03 送达" />
			</MSteps>
		</div>

		<div class="m-steps-demo__title">
			label-position="right"（空间不足时标题显示省略号）
		</div>
		<div class="m-steps-demo__card">
			<MSteps :model-value="2" label-position="right">
				<MStep title="已完成" />
				<MStep title="进行中的步骤" />
				<MStep title="未开始" />
			</MSteps>
		</div>

		<div class="m-steps-demo__title">
			箭头
		</div>
		<div class="m-steps-demo__card">
			<MSteps :model-value="2" type="arrow">
				<MStep title="已完成" />
				<MStep title="进行中" />
				<MStep title="未开始" />
			</MSteps>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MSteps, MStep } from '../index.m';
import { MButton } from '../../button/index.m';

const text = '包裹已到达转运中心，正在发往下一站，内容较长时自动换行，与下一步之间保持间距。';
const current = ref(2);
</script>

<style lang="scss">
.m-steps-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__card {
		padding: calc(var(--vc-rem) * 32);
		background: var(--vc-background-color-lightest);
	}

	&__toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: calc(var(--vc-rem) * 16);
		margin-top: calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 24);
		color: var(--vc-color-dark-extralight);
	}
}
</style>
