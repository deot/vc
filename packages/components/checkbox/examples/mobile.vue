<template>
	<div class="demo">
		<div class="demo__title">默认</div>
		<div class="demo__card">
			<MCheckbox v-model="single" label="选项内容" />
			<MCheckbox :model-value="true" label="选项内容" style="margin-left: 24px;" />
		</div>

		<div class="demo__title">禁用</div>
		<div class="demo__card">
			<MCheckbox disabled label="未选中禁用" />
			<MCheckbox :model-value="true" disabled label="选中禁用" style="margin-left: 24px;" />
		</div>

		<div class="demo__title">竖排分组（vertical）</div>
		<div class="demo__card">
			<MCheckboxGroup v-model="vertical" vertical>
				<MCheckbox value="a" label="选项内容 1" />
				<MCheckbox value="b" label="选项内容 2" />
				<MCheckbox value="c" label="选项内容 3" />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">横排分组</div>
		<div class="demo__card">
			<MCheckboxGroup v-model="horizontal">
				<MCheckbox value="a" label="选项 1" />
				<MCheckbox value="b" label="选项 2" />
				<MCheckbox value="c" label="选项 3" disabled />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">最多可选两项（max）</div>
		<div class="demo__card">
			<MCheckboxGroup v-model="limited" :max="2" vertical>
				<MCheckbox value="a" label="选项内容 1" />
				<MCheckbox value="b" label="选项内容 2" />
				<MCheckbox value="c" label="选项内容 3" />
				<MCheckbox value="d" label="选项内容 4" />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">全选（indeterminate）</div>
		<div class="demo__card">
			<MCheckbox
				:indeterminate="isIndeterminate"
				:model-value="isAll"
				label="全选"
				@click.prevent="handleCheckAll"
			/>
			<MCheckboxGroup v-model="checked" vertical>
				<MCheckbox v-for="item in all" :key="item" :value="item" :label="`选项内容 ${item}`" />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">分组样式（type）</div>
		<div class="demo__card demo__stack">
			<MCheckboxGroup v-for="type in types" :key="type" v-model="typed" :type="type">
				<MCheckbox value="a" label="选项 1" />
				<MCheckbox value="b" label="选项 2" />
				<MCheckbox value="c" label="选项 3" />
				<MCheckbox value="d" label="禁用" disabled />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">尺寸（size）</div>
		<div class="demo__card demo__stack">
			<MCheckboxGroup v-for="item in sizes" :key="item" v-model="typed" type="button" :size="item">
				<MCheckbox value="a" :label="item" />
				<MCheckbox value="b" label="选项 2" />
				<MCheckbox value="c" label="选项 3" />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">筛选标签：换行与上限（type="round" max="3"）</div>
		<div class="demo__card">
			<MCheckboxGroup v-model="tags" type="round" :max="3">
				<MCheckbox v-for="item in tagOptions" :key="item" :value="item" :label="item" />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">整组禁用</div>
		<div class="demo__card">
			<MCheckboxGroup :model-value="['a']" disabled>
				<MCheckbox value="a" label="选项 1" />
				<MCheckbox value="b" label="选项 2" />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">方形（shape）</div>
		<div class="demo__card">
			<MCheckboxGroup v-model="square" shape="square">
				<MCheckbox value="a" label="选项 1" />
				<MCheckbox value="b" label="选项 2" />
				<MCheckbox value="c" label="选项 3" indeterminate />
			</MCheckboxGroup>
		</div>

		<div class="demo__title">自定义图标（#icon）</div>
		<div class="demo__card">
			<MCheckboxGroup v-model="custom">
				<template #icon="{ checked: on, disabled }">
					<span class="demo__icon" :class="{ 'is-on': on, 'is-disabled': disabled }">{{ on ? '★' : '☆' }}</span>
				</template>
				<MCheckbox value="a" label="选项 1" />
				<MCheckbox value="b" label="选项 2" />
				<MCheckbox value="c" label="选项 3" disabled />
			</MCheckboxGroup>
		</div>
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { MCheckbox, MCheckboxGroup } from '../index.m';

const single = ref(false);
const vertical = ref(['b']);
const horizontal = ref(['b', 'c']);
const limited = ref(['b', 'c']);
const square = ref(['a']);
const custom = ref(['a', 'c']);

const types = ['button', 'card', 'capsule', 'text', 'round'];
const sizes = ['mini', 'small', 'medium', 'large'];
const typed = ref(['a', 'b']);
const tagOptions = ['标签一', '标签二', '较长的标签三', '标签四', '标签五', '标签六', '标签七'];
const tags = ref(['标签一']);

const all = [1, 2, 3, 4];
const checked = ref([2, 4]);
const isAll = computed(() => checked.value.length === all.length);
const isIndeterminate = computed(() => checked.value.length > 0 && !isAll.value);

const handleCheckAll = () => {
	checked.value = isAll.value ? [] : [...all];
};
</script>
<style scoped>
.demo {
	min-height: 100vh;
	background: #f7f8fa;
}

.demo__title {
	padding: 16px 16px 8px;
	font-size: 14px;
	color: #86909c;
}

.demo__card {
	padding: 12px 16px;
	background: #fff;
}

.demo__stack {
	display: grid;
	gap: 12px;
	justify-items: start;
}

.demo__icon {
	font-size: 20px;
	line-height: 1;
	color: #c9cdd4;
}

.demo__icon.is-on {
	color: #456cf6;
}

.demo__icon.is-disabled {
	opacity: .5;
}
</style>
