export interface TopicwiseDirectoryItem {
  _id: string;
  name: string;
  type: 'folder' | 'file';
  category: 'gs1-analysis' | 'gs2-analysis' | 'gs3-analysis' | 'gs4-analysis' | 'essay-analysis' | 'optional-subjects';
  path: string;
  fullPath: string;
  parent: string | null;
  
  // File specific
  fileLink?: string;
  description?: string;
  fileType?: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'other';
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual
  children?: TopicwiseDirectoryItem[];
}