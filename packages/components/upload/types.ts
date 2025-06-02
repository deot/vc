export interface UploadFile {
	uploadId: string;
	current: number;
	total: number;
	percent: number;
	// File
	key: string;
	size: number;
	name: string;
	source: File;
};
