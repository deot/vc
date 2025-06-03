/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { Button } from '../../../button';

const getTimeType = (type: string) => {
	let view: any;
	switch (type) {
		case 'date':
			view = 'time';
			break;
		case 'month':
		case 'year':
		case 'daterange':
			view = 'timerange';
			break;
		case 'time':
			view = 'date';
			break;
		case 'timerange':
			view = 'daterange';
			break;
		default:
			break;
	}
	return view;
};

const COMPONENT_NAME = 'vc-date-confirm';

export const Confirm = defineComponent({
	name: COMPONENT_NAME,
	props: {
		showTime: {
			type: Boolean,
			default: false
		},
		currentView: {
			type: [String, Array],
			default: 'date'
		}
	},
	setup(props, { emit }) {
		const label = computed(() => {
			if (Array.isArray(props.currentView)) {
				return props.currentView.every((view: any) => view.includes('time')) ? '选择日期' : '选择时间';
			}
			return props.currentView.includes('date') ? '选择时间' : '选择日期';
		});

		const handleToggleTime = () => {
			let view: any;

			if (Array.isArray(props.currentView)) {
				view = [getTimeType(props.currentView[0] as string), getTimeType(props.currentView[1] as string)];
			} else {
				view = getTimeType(props.currentView);
			}
			emit('toggle-time', view);
		};

		const handleConfirm = (e) => {
			emit('ok', e);
		};

		const handleClear = (e) => {
			emit('clear', e);
		};
		return () => {
			return (
				<div class="vc-date-confirm">
					{
						props.showTime && (
							<Button
								size="small"
								type="text"
								class="vc-date-confirm__time"
								onClick={handleToggleTime}
							>
								{label.value}
							</Button>
						)
					}
					<Button size="small" onClick={handleClear}>
						清空
					</Button>
					<Button
						size="small"
						type="primary"
						style="margin-left: 5px"
						onClick={handleConfirm}
					>
						确定
					</Button>
				</div>
			);
		};
	}
});
