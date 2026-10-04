export interface Testimonial {
  _id: string;
  rating: number;
  description: string;
  nameHindi?: string; descriptionHindi?: string; subtitleHindi?: string;
  name: string;
  subtitle: string;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TestimonialPayload = Pick<Testimonial, 'nameHindi' | 'descriptionHindi' | 'subtitleHindi' | 'rating' | 'description' | 'name' | 'subtitle' | 'image'>;

export interface TestimonialResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}
