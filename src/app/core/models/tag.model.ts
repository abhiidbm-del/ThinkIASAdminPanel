// export interface Tag {
//   _id: string;
//   tag: string;
// }

export interface TagResponse {
  success: boolean;
  message: string;
  data?: Tag | Tag[];
}

export interface Tag {
  _id: string;
  category: string;
  subCategory: string;
  topic: string;
  tag: string; // This will store the combined path: category/sub-category/topic
  createdAt?: Date;
  updatedAt?: Date;
}