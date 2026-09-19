/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { useLocale } from '../../../locale';
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
		const { t } = useLocale();
		const label = computed(() => {
			if (Array.isArray(props.currentView)) {
				return props.currentView.every((view: any) => view.includes('time')) ? t('vc.DatePicker.selectDate') : t('vc.DatePicker.selectTime');
			}
			return props.currentView.includes('date') ? t('vc.DatePicker.selectTime') : t('vc.DatePicker.selectDate');
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
						{t('vc.DatePicker.clearText')}
					</Button>
					<Button
						size="small"
						type="primary"
						style="margin-left: 5px"
						onClick={handleConfirm}
					>
						{t('vc.DatePicker.okText')}
					</Button>
				</div>
			);
		};
	}
});
