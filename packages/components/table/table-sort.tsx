import { defineComponent, withModifiers } from 'vue';

export const TableSort = defineComponent({
	name: 'vc-table-sort',
	props: {
		order: String
	},
	emits: ['click'],
	setup(props, { emit }) {
		const handleClick = (v: string) => {
			emit('click', props.order !== v ? v : '');
		};

		return () => {
			return (
				<span class="vc-table-sort">
					<span
						class={[
							{ 'is-ascending': props.order === 'ascending' },
							'vc-table-sort__icon vc-table-sort__icon--ascending'
						]}
						onClick={withModifiers(() => handleClick('ascending'), ['stop'])}
					/>

					<span
						class={[
							{ 'is-descending': props.order === 'descending' },
							'vc-table-sort__icon vc-table-sort__icon--descending'
						]}
						onClick={withModifiers(() => handleClick('descending'), ['stop'])}
					/>
				</span>
			);
		};
	},

});
