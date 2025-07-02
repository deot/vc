<script lang="tsx">
import { ref, defineComponent } from 'vue';
import { Form, FormItem } from '..';
import { Select } from '../../select';

export default defineComponent({
	setup() {
		const select = ref([]);

		return () => {
			return (
				<Form
					model={{ select: select.value }}
					label-width={96}
					style="padding-left: 56px; margin-top: 21px"
				>
					<FormItem prop="select" label="select" required="必填">
						<Select
							modelValue={select.value}
							data={[{ label: 'Apple', value: 'apple' }]}
							clearable
							style="width: 300px"
							onChange={v => select.value = v}
						/>
					</FormItem>
				</Form>
			);
		};
	}
});
</script>
