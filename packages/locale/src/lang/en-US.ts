import type { Language } from '../types';

export const enUS: Language = {
	name: 'en-US',
	vc: {
		Tour: {
			previousText: 'Previous',
			nextText: 'Next',
			finishText: 'Got it',
			skipText: 'Skip',
			close: 'Close tour',
			progress: 'Step {current} of {total}'
		},
		Cascader: {
			placeholder: 'Please select'
		},
		ColorPicker: {
			clearText: 'Clear',
			confirmText: 'OK'
		},
		Picker: {
			extra: 'Please select',
			cancelText: 'Cancel',
			okText: 'OK'
		},
		UploadPicker: {
			upload: 'Upload',
			failed: 'Upload failed',
			receiving: 'Receiving on server...',
			previewAudio: 'Preview audio',
			previewVideo: 'Preview video'
		},
		Upload: {
			remoteError: 'Upload response failed. Please try again',
			sizeLimit: 'Upload failed. Maximum size: {size}MB',
			serverError: 'Server error',
			aborted: 'Upload aborted',
			timeout: 'Upload timed out',
			requestError: 'Request failed',
			parseError: 'Upload processing failed. Please try again',
			failed: 'Upload failed',
			acceptLimit: 'Allowed file formats: {accept}',
			countLimit: 'Select no more than {max} files',
			directoryLimit: 'The folder must contain no more than {max} files',
			canceled: 'Upload canceled',
			loading: 'Uploading...',
			pending: 'Waiting',
			uploading: 'Uploading',
			taskLabel: 'Upload tasks',
			taskTitle: 'Current upload progress',
			close: 'Close',
			closeResult: 'Close upload results',
			result: 'Upload finished. Succeeded: {succeeded}, failed: {failed}, total: {total}',
			fileName: 'File name',
			fileSize: 'File size',
			status: 'Status'
		},
		Tree: {
			emptyText: 'No data'
		},
		TreeSelect: {
			placeholder: 'Please select',
			noMatch: 'No matching data'
		},
		Table: {
			emptyText: 'No data',
			sumText: 'Total',
			filterReset: 'Reset',
			filterConfirm: 'Confirm',
			filterAll: 'All'
		},
		Pagination: {
			total: '{total} items',
			previousPage: 'Previous page',
			nextPage: 'Next page',
			previousPages: 'Previous {count} pages',
			nextPages: 'Next {count} pages',
			pageSize: '{size} / page',
			goto: 'Go to',
			page: 'page'
		},
		RecycleList: {
			empty: 'No data',
			complete: 'All loaded',
			pullDown: '↓ Pull down to refresh',
			pullUp: '↑ Pull up to refresh',
			pullRight: '→ Pull right to refresh',
			pullLeft: '← Pull left to refresh',
			releaseUp: '↑ Release to refresh',
			releaseDown: '↓ Release to refresh',
			releaseLeft: '← Release to refresh',
			releaseRight: '→ Release to refresh',
			refreshing: 'Loading...',
		},
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
		Popconfirm: {
			okButtonText: 'OK',
			cancelButtonText: 'Cancel'
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
		FilePreview: {
			close: 'Close'
		},
		ImagePreview: {
			closeTitle: 'Close (Esc)',
			zoomTitle: 'Zoom',
			arrowPrevTitle: 'Previous image',
			arrowNextTitle: 'Next image',
			errorMsg: 'Failed to load image'
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
