import type { Language } from '../types';

export const enUS: Language = {
	name: 'en-US',
	vc: {
		Select: {
			placeholder: 'Please select',
			selectAll: 'Select all',
			deselectAll: 'Deselect all'
		},
		InputNumber: {
			maxExceeded: 'Value cannot exceed {max}',
			minExceeded: 'Value cannot be less than {min}',
			cannotIncrease: 'Cannot increase further',
			cannotDecrease: 'Cannot decrease further'
		},
		MInputSearch: {
			cancelText: 'Cancel'
		},
		Snapshot: {
			generating: 'Generating...'
		},
		Drawer: {
			okButtonText: 'OK',
			cancelButtonText: 'Cancel'
		},
		Countdown: {
			format: 'DDd HHh mmm sss SSS'
		},
		Calendar: {
			months: {
				january: 'January',
				february: 'February',
				march: 'March',
				april: 'April',
				may: 'May',
				june: 'June',
				july: 'July',
				august: 'August',
				september: 'September',
				october: 'October',
				november: 'November',
				december: 'December'
			},
			weekdays: {
				sunday: 'Sun',
				monday: 'Mon',
				tuesday: 'Tue',
				wednesday: 'Wed',
				thursday: 'Thu',
				friday: 'Fri',
				saturday: 'Sat'
			}
		},
		Clipboard: {
			copySuccess: 'Copied successfully'
		},
		Image: {
			loadError: 'Failed to load image'
		},
		Modal: {
			okButtonText: 'OK',
			cancelButtonText: 'Cancel'
		}
	}
};
