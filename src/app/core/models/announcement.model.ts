export interface Announcement {
  _id: string;
  title: string;
  titleHindi?: string;
  shortDescription: string;
  shortDescriptionHindi?: string;
  isActive: boolean;
  publishDate: Date;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  lastUpdatedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  hasHindi?: boolean;
}

export interface CreateAnnouncementDto {
  title: string;
  titleHindi?: string;
  shortDescription: string;
  shortDescriptionHindi?: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  titleHindi?: string;
  shortDescription?: string;
  shortDescriptionHindi?: string;
  isActive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}