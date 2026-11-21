<template>
	<div class="m-alert-demo">
		<h3>基础</h3>
		<MAlert title="这是一条普通提示信息。" />
		<MAlert type="success" title="文件已上传完成。" />
		<MAlert type="warning" title="当前网络较慢，内容可能加载不完整。" closable />
		<MAlert type="error" title="网络不可用，请检查网络设置。" closable />

		<h3>标题 + 说明</h3>
		<MAlert type="warning" title="提示标题" description="说明文字可以换行，用于补充当前提示的详细内容。" closable />
		<MAlert title="短标题" :description="longDesc" />
		<MAlert type="error" title="短标题" :description="longDesc" closable>
			<template #suffix>
				<MIcon type="right" />
			</template>
		</MAlert>
		<MAlert type="success" :icon="false" title="短标题" :description="longDesc" />
		<MAlert type="warning" marquee title="短标题" :description="longDesc" closable />

		<h3>跑马灯（超出一行才滚动）</h3>
		<MAlert :icon="false" marquee :title="longText" />
		<MAlert type="warning" marquee :title="longText" closable />
		<MAlert type="success" marquee title="内容较短也滚动" :marquee-options="{ always: true }" />

		<h3>单行省略</h3>
		<MAlert type="warning" :title="longText" class="m-alert-demo__ellipsis" />

		<h3>prefix / suffix</h3>
		<MAlert type="warning" :title="text" @click="clicked++">
			<template #suffix>
				<MIcon type="right" />
			</template>
		</MAlert>
		<MAlert type="error" :icon="false" :title="text">
			<template #prefix>
				<MIcon type="o-warning" />
			</template>
			<template #suffix>
				<span class="m-alert-demo__action">开启</span>
			</template>
		</MAlert>
		<MAlert v-model="visible" type="warning" :title="text" closable>
			<template #close>
				<span>不再提示</span>
			</template>
		</MAlert>
		<p class="m-alert-demo__status">
			点击次数：{{ clicked }}<span v-if="!visible" @click="visible = true">，重新显示</span>
		</p>

		<h3>竖向轮播</h3>
		<MAlert type="warning">
			<MCarousel :height="40" vertical :indicator="false" :draggable="false">
				<MCarouselItem v-for="item in 3" :key="item">
					第 {{ item }} 条提示信息
				</MCarouselItem>
			</MCarousel>
		</MAlert>

		<h3>强调文字</h3>
		<MAlert type="warning">
			已选择<em>12</em>项，其中<em>3</em>项将被跳过。
		</MAlert>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MAlert } from '../index.m';
import { MIcon } from '../../icon/index.m';
import { MCarousel, MCarouselItem } from '../../carousel/index.m';

const visible = ref(true);
const clicked = ref(0);
const text = '这是一条提示信息。';
const longDesc = '这是一段较长的说明文字，用于检查短标题与多行说明同时出现时的对齐效果，说明文字会换成多行显示。';
const longText = '这是一条较长的提示信息，长度超过容器宽度，超出时会从右向左循环滚动显示。';
</script>

<style scoped>
.m-alert-demo {
	display: grid;
	gap: 12px;
	padding-bottom: 32px;
}

.m-alert-demo h3 {
	margin: 12px 16px 0;
}

.m-alert-demo__action {
	padding: 0 8px;
	font-size: 13px;
	line-height: 24px;
	color: #fff;
	background: var(--vc-color-error);
	border-radius: 12px;
}

.m-alert-demo__status {
	margin: 0 16px;
	font-size: 13px;
	color: var(--vc-color-dark-lightest);
}
</style>

<style>
/* 单行省略：标题不换行，超出省略 */
.m-alert-demo__ellipsis .vc-alert__title {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
