<template>
	<div class="m-list-demo">
		<MList header="基础用法（375 宽下行高 54）">
			<MListItem label="标题" :arrow="false" />
			<MListItem label="标题" extra="内容" />
			<MListItem label="标题" extra="内容" :arrow="false" />
			<MListItem label="点击计数" :extra="`已点击 ${count} 次`" :arrow="false" @click="count++" />
		</MList>

		<MList header="描述（375 宽下行高 74）">
			<MListItem label="标题" description="描述文字" extra="内容" />
			<MListItem label="标题" description="描述文字" :arrow="false">
				<template #extra>
					<strong>+12.5</strong>
				</template>
			</MListItem>
		</MList>

		<MList header="图标" footer="icon 为 MIcon 的类型；icon 插槽可放头像等任意内容">
			<MListItem icon="search" label="标题" extra="内容" />
			<MListItem icon="success" label="标题" description="描述文字" />
			<MListItem label="标题" extra="内容">
				<template #icon>
					<span class="m-list-demo__avatar" />
				</template>
			</MListItem>
		</MList>

		<MList header="标签宽度与长内容" :label-width="160">
			<MListItem label="标题" extra="单行模式下 extra 右对齐，最多显示两行，超出部分省略显示，这里补充一些文字用来演示截断效果" />
			<MListItem label="较长的标题文字" :label-width="0" extra="0 表示自动宽度" :arrow="false" />
		</MList>

		<MList header="多行" :border="false">
			<MListItem label="标题" multiple :arrow="false" extra="multiple 时 label 在上、extra 在下，extra 不限行数，内容换行后保持左对齐，这里补充一些文字用来演示多行效果" />
		</MList>

		<div class="m-list-demo__title">
			独立列表项（不在 MList 内）
		</div>
		<MListItem label="独立入口" :extra="`已点击 ${aloneCount} 次`" :to="() => aloneCount++" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '../index.m';

const count = ref(0);
const aloneCount = ref(0);
</script>

<style lang="scss">
.m-list-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__avatar {
		display: block;
		width: calc(var(--vc-rem) * 64);
		height: calc(var(--vc-rem) * 64);
		background: var(--vc-color-neutral);
		border-radius: 50%;
	}
}
</style>
