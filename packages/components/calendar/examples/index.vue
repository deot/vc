<template>
	<div class="v-calendar-example">
		<div class="v-calendar-example__tools">
			<Button @click="basic?.prev()">
				上个月
			</Button>
			<Button @click="basic?.next()">
				下个月
			</Button>
			<Button @click="toggleLang">
				{{ lang === 'ch' ? 'English' : '中文' }}
			</Button>
		</div>
		<Calendar ref="basic" :lang="lang">
			<template #month="{ data }">
				<div class="v-calendar-example__month">
					{{ data.month }} {{ data.year }}
				</div>
			</template>
			<template #week="{ data }">
				<div class="v-calendar-example__week">
					<span
						v-for="item in data"
						:key="item"
					>
						{{ item }}
					</span>
				</div>
			</template>
			<template #default="{ cell, today, holiday }">
				<span
					:class="{ 'is-selected': cell.value === today }"
					class="v-calendar-example__date"
				>
					{{ cell.date }}
					<small v-if="holiday.holiday">{{ holiday.holiday }}</small>
				</span>
			</template>
		</Calendar>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Calendar } from '..';
import { Button } from '../../button';

const basic = ref();
const lang = ref('ch');

const toggleLang = () => {
	lang.value = lang.value === 'ch' ? 'en' : 'ch';
};
</script>

<style lang="scss">
.v-calendar-example {
	width: 100%;

	&__tools {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	&__month {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 56px;
		color: #2e3136;
		font-size: 22px;
		background: #f5f6f7;
	}

	&__week {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		padding: 12px 0;
		color: #666;
		text-align: center;
	}

	&__date {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 22px;

		&.is-selected {
			color: #fff;
			background: #2f75ef;
		}

		small {
			max-width: 40px;
			overflow: hidden;
			font-size: 10px;
			line-height: 1.2;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
}
</style>
