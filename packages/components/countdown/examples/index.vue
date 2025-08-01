<template>
	<div>
		<Countdown
			:target-time="targetTime"
			:server-time="new Date()"
			:t="1000"
			style="color:blue"
			format="DD:HH:mm:ss"
			@finish="handleEnd(1)"
		/>
		<br>
		<Countdown
			:server-time="serverTime"
			:t="1000"
			target-time="2029-05-22 15:00:00"
			style="color:blue"
			format="DD:HH:mm:ss"
			@finish="handleEnd(2)"
		/>
		<br>
		<Countdown
			:target-time="targetTime"
			:server-time="serverTime"
			:t="10"
			style="color:blue"
			format="DD:HH:mm:ss:SSS"
			@finish="handleEnd(3)"
		/>
		<br>
		<Countdown
			:target-time="targetTime"
			:server-time="serverTime"
			:t="10"
			:show-zero="false"
			style="color:blue"
			format="DD:HH:mm:ss:SSS"
			@finish="handleEnd(4)"
		/>
		<br>
		<Countdown
			:render="renderRow"
			target-time="2029-10-15 10:10:10"
			server-time="2027-10-15 10:10:5"
			@error="handleError"
			@change="handleChange(arguments[0], 5)"
			@finish="handleEnd(5)"
		/>
		<br>
		<Countdown
			target-time="2029-10-15 10:10:10"
			server-time="2027-10-15 10:10:5"
			@error="handleError"
			@change="handleChange(arguments[0], 6)"
			@finish="handleEnd(6)"
		>
			<template #default="it">
				{{ it.second }}
			</template>
		</Countdown>
		<Countdown
			target-time="2029-10-15 10:10:10"
			server-time="2027-10-15 10:10:5"
			@error="handleError"
			@change="handleChange(arguments[0], 7)"
			@finish="handleEnd(7)"
		>
			<div>
				test
			</div>
		</Countdown>
		<div @click="handleTarget">
			点我targetTime: Data.now() + 1d
		</div>
		<div @click="handleServer">
			点我serverTime: Data.now() - 1d
		</div>
	</div>
</template>
<script setup>
import { h, ref } from 'vue';
import { Countdown } from '..';

const targetTime = ref(new Date());
const serverTime = ref(new Date());

const handleTarget = () => {
	targetTime.value = new Date().getTime() + 1000 * 60 * 60 * 24;
};

const handleServer = () => {
	serverTime.value = new Date().getTime() - 1000 * 60 * 60 * 24;
};

const handleError = (message) => {
	console.log(message);
};

const handleChange = () => {
	// console.log('change:', res);
};

const handleEnd = (id) => {
	console.log('end', id);
};

const renderRow = (props) => {
	const { day, hour, minute, second, millisecond, tag } = props;
	const num = Number(millisecond);
	const r = num % 255;
	const g = (num + 100) % 255;
	const b = (num + 200) % 255;
	return h(
		tag,
		{
			style: `color:rgb(${r}, ${g}, ${b})`,
			class: props.class,
		},

		`${day}-${hour}-${minute}-${second}`
	);
};

</script>
