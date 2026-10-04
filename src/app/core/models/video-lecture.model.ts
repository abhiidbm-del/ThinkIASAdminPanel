export interface VideoLectureItem {
  _id: string;
  name: string;
  type: 'folder' | 'file';
  category: string;
  path: string;
  fullPath: string;
  parent?: string;
  fileLink?: string;
  description?: string;
  duration?: string;
  thumbnail?: string;
  fileType?: 'video' | 'youtube' | 'vimeo' | 'drive' | 'other';
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  children?: VideoLectureItem[];
}