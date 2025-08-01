export const getTimestamp = (date: string | Date | number) => {
	if (date instanceof Date) {
		return date.getTime();
	} else if (typeof date === 'string') {
		return Date.parse(date.replace(/-/g, '/'));
	}
	return date;
};

export const formatter = (format: String, arr: any[]) => {
	// YYYY,MM
	return format
		.replace('DD', arr[0])
		.replace('HH', arr[1])
		.replace('mm', arr[2])
		.replace('ss', arr[3])
		.replace('SSS', arr[4]);
};
