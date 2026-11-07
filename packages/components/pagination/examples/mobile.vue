<template>
	<div class="m-pagination-demo">
		<h3>基础（尺寸随 --vc-rem 缩放）</h3>
		<MPagination v-model:current="current.basic" :count="60" />
		<MPagination v-model:current="current.primary" :count="60" next-type="primary" />

		<h3>文字</h3>
		<MPagination v-model:current="current.text" :count="50" type="text" />
		<MPagination v-model:current="current.textPrimary" :count="50" type="text" next-type="primary" />

		<h3>图标</h3>
		<MPagination v-model:current="current.icon" :count="50" icon />

		<h3>图标（居中，只显示图标）</h3>
		<MPagination
			v-model:current="current.center"
			:count="60"
			icon
			justify="center"
			previous-text=""
			next-text=""
		/>

		<h3>只显示页码</h3>
		<MPagination v-model:current="current.simple" :count="50" type="simple" />

		<h3>插槽：章节导航</h3>
		<MPagination v-model:current="current.chapter" :count="60" :page-size="20">
			<template #previous="{ current: page, disabled, previous }">
				<span v-if="!disabled" class="m-pagination-demo__link" @click="previous">
					第 {{ page - 1 }} 章
				</span>
			</template>
			<template #default="{ current: page, total }">
				<span class="m-pagination-demo__chapter">第 {{ page }} 章 · 共 {{ total }} 章</span>
			</template>
			<template #next="{ current: page, disabled, next }">
				<span v-if="!disabled" class="m-pagination-demo__link" @click="next">
					第 {{ page + 1 }} 章
				</span>
			</template>
		</MPagination>

		<h3>只有一页时隐藏（hideOnSinglePage）</h3>
		<MPagination :count="count" hide-on-single-page />
		<div class="m-pagination-demo__row">
			<MButton size="small" @click="count = count > 10 ? 8 : 30">
				数据总数：{{ count }}
			</MButton>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { MPagination } from '../index.m';
import { MButton } from '../../button/index.m';

const current = reactive({
	basic: 1,
	primary: 1,
	text: 1,
	textPrimary: 1,
	icon: 2,
	center: 1,
	simple: 1,
	chapter: 1
});
const count = ref(30);
</script>
<style>
.m-pagination-demo {
	padding: 16px 0;
}

.m-pagination-demo h3 {
	padding: 0 16px;
}

.m-pagination-demo__link {
	font-size: calc(var(--vc-rem) * 30);
	color: var(--vc-color-primary);
}

.m-pagination-demo__chapter {
	font-size: calc(var(--vc-rem) * 30);
}

.m-pagination-demo__row {
	padding: 0 16px;
}
</style>
