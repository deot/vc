<template>
	<div class="m-dropdown-demo">
		<div class="m-dropdown-demo__title">
			筛选栏（caret；375 宽下菜单项高 54，弹层占满视口宽度）
		</div>
		<div class="m-dropdown-demo__bar">
			<MDropdown caret @click="value => sort = value">
				{{ sortLabel }}
				<template #content>
					<MDropdownMenu>
						<MDropdownItem
							v-for="item in sorts"
							:key="item.value"
							:value="item.value"
							:label="item.label"
							:selected="sort === item.value"
						/>
					</MDropdownMenu>
				</template>
			</MDropdown>
			<MDropdown caret @click="value => range = value">
				{{ range }}
				<template #content>
					<MDropdownMenu>
						<MDropdownItem v-for="item in ranges" :key="item" :label="item" :selected="range === item" />
						<MDropdownItem label="不可选" disabled />
						<MDropdownItem label="清除" value="全部" divided />
					</MDropdownMenu>
				</template>
			</MDropdown>
			<MDropdown ref="more" caret>
				更多
				<template #content>
					<MDropdownMenu>
						<MDropdownItem
							v-for="item in options"
							:key="item"
							:label="item"
							:selected="checked.includes(item)"
							:closable="false"
							@click="handleCheck"
						/>
					</MDropdownMenu>
				</template>
				<template #footer>
					<div class="m-dropdown-demo__footer">
						<MButton @click="checked = []">
							重置
						</MButton>
						<MButton type="primary" @click="$refs.more.close()">
							确定
						</MButton>
					</div>
				</template>
			</MDropdown>
		</div>
		<p class="m-dropdown-demo__result">
			排序：{{ sortLabel }}；范围：{{ range }}；更多：{{ checked.join('、') || '无' }}
		</p>

		<div class="m-dropdown-demo__title">
			按钮作为触发区、长列表滚动
		</div>
		<div class="m-dropdown-demo__row">
			<MDropdown v-model="visible">
				<MButton>选项 {{ visible ? '（展开中）' : '' }}</MButton>
				<template #content>
					<MDropdownMenu>
						<MDropdownItem v-for="item in 30" :key="item" :label="`选项 ${item}`" />
					</MDropdownMenu>
				</template>
			</MDropdown>
			<MDropdown caret disabled>
				禁用
			</MDropdown>
		</div>

		<div class="m-dropdown-demo__spacer" />

		<div class="m-dropdown-demo__title">
			靠近底部：剩余空间不足时向上展开
		</div>
		<div class="m-dropdown-demo__bar">
			<MDropdown caret placement="top">
				向上展开
				<template #content>
					<MDropdownMenu>
						<MDropdownItem v-for="item in 4" :key="item" :label="`选项 ${item}`" />
					</MDropdownMenu>
				</template>
			</MDropdown>
			<MDropdown caret>
				自动翻转
				<template #content>
					<MDropdownMenu>
						<MDropdownItem v-for="item in 4" :key="item" :label="`选项 ${item}`" />
					</MDropdownMenu>
				</template>
			</MDropdown>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { MDropdown, MDropdownMenu, MDropdownItem } from '../index.m';
import { MButton } from '../../button/index.m';

const sorts = [
	{ value: 'default', label: '默认排序' },
	{ value: 'newest', label: '最新' },
	{ value: 'name', label: '名称' }
];
const ranges = ['全部', '近 7 天', '近 30 天'];
const options = ['选项 A', '选项 B', '选项 C', '选项 D'];

const sort = ref('default');
const range = ref('全部');
const checked = ref([]);
const visible = ref(false);

const sortLabel = computed(() => sorts.find(item => item.value === sort.value).label);

const handleCheck = (value) => {
	checked.value = checked.value.includes(value)
		? checked.value.filter(item => item !== value)
		: [...checked.value, value];
};
</script>

<style lang="scss">
.m-dropdown-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__bar {
		display: flex;
		font-size: calc(var(--vc-rem) * 28);
		line-height: calc(var(--vc-rem) * 88);
		color: var(--vc-color-dark-light);
		background: var(--vc-background-color-lightest);

		> .vcm-dropdown {
			justify-content: center;
			flex: 1;
		}
	}

	&__row {
		display: flex;
		padding: 0 calc(var(--vc-rem) * 32);
		align-items: center;
		gap: calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
	}

	&__result {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		margin: 0;
		font-size: calc(var(--vc-rem) * 26);
		color: var(--vc-color-dark-lighter);
	}

	&__footer {
		display: flex;
		padding-top: calc(var(--vc-rem) * 24);
		gap: calc(var(--vc-rem) * 24);

		> .vc-button {
			flex: 1;
		}
	}

	&__spacer {
		height: 120vh;
	}
}
</style>
