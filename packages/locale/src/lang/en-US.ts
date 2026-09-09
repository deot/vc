import type { Language } from '../types';

export const enUS: Language = {
	name: 'en-US',
	vc: {
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
		Modal: {
			okButtonText: 'OK',
			cancelButtonText: 'Cancel'
		}
	}
};
