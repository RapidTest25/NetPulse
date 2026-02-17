export interface PostDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body?: string;
  cover_url?: string;
  status: string;
  author_id: string;
  category_id?: string;
  published_at?: string;
  scheduled_at?: string;
  meta_title?: string;
  meta_description?: string;
  canonical?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePostDTO {
  title: string;
  body: string;
  excerpt?: string;
  cover_url?: string;
  category_id?: string;
  tag_ids?: string[];
  meta_title?: string;
  meta_description?: string;
}

export interface UpdatePostDTO {
  title?: string;
  body?: string;
  excerpt?: string;
  cover_url?: string;
  category_id?: string;
  tag_ids?: string[];
  meta_title?: string;
  meta_description?: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface TagDTO {
  id: string;
  name: string;
  slug: string;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  is_active: boolean;
  roles?: { id: string; name: string }[];
}

export interface TokenPairDTO {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
