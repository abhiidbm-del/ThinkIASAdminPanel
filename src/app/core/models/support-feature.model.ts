export interface SupportFeature {
  _id: string;
  title: string;
  titleHindi: string;
  description: string;
  descriptionHindi: string;
  points: string[];
  pointsHindi: string[];
  footer: string;
  footerHindi: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export type SupportFeaturePayload = Omit<SupportFeature, '_id'>;

export interface SupportFeatureResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}
