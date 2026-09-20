import type { Language } from '../types';

export const enUS: Language = {
	name: 'en-US',
	vc: {
		Editor: {
			videoPlaceholder: 'Embed URL',
			placeholder: 'Please enter content',
			open: 'Visit URL:',
			edit: 'Edit',
			remove: 'Remove',
			link: 'Enter link:',
			save: 'Save',
			text: 'Normal',
			heading: 'Heading {level}',
			lineHeight: 'Line height:',
			letterSpacing: 'Spacing:',
			font: 'Sans Serif',
			serif: 'Serif',
			monospace: 'Monospace',
			small: 'Small',
			large: 'Large',
			huge: 'Huge',
			formula: 'Enter formula:',
			video: 'Enter video:'
		},
		DatePicker: {
			clearText: 'Clear',
			selectDate: 'Select date',
			selectTime: 'Select time',
			startTime: 'Start time',
			endTime: 'End time',
			weekdays: {
				sunday: 'Sun',
				monday: 'Mon',
				tuesday: 'Tue',
				wednesday: 'Wed',
				thursday: 'Thu',
				friday: 'Fri',
				saturday: 'Sat'
			},
			placeholder: 'Please select',
			cancelText: 'Cancel',
			okText: 'OK',
			year: '{value}',
			month: '{value}',
			day: '{value} day',
			hour: '{value} h',
			minute: '{value} min',
			second: '{value} s',
			yearQuarter: '{year} {quarter}',
			quarter: {
				first: 'Q1',
				second: 'Q2',
				third: 'Q3',
				fourth: 'Q4'
			}
		},
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
