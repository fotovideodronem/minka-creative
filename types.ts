
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  BOTH = 'both'
}

export type FileType = 'image' | 'video' | 'folder' | 'other' | 'system';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  updatedAt: string;
  url?: string;
  parentId: string | null;
  alt?: string;
  description?: string;
  specializationId?: string;
  mediaType?: 'photo' | 'video' | 'system';
  seoTitle?: string;
  dimensions?: string;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  source: 'storage' | 'pc' | 'youtube';
}

export interface Project {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string;
  thumbnailSource: 'storage' | 'pc' | 'youtube';
  type: MediaType;
  date: string;
  gallery?: GalleryItem[];
  weight?: number;
  servicesDelivered?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  youtubeCoverUrl?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  date: string;
  author: string;
  tags: string[];
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface Specialization {
  id: string;
  name: string;
  description: string;
  image: string;
  caseStudies: string[];
  values: string[];
  externalUrl?: string;
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface WebSettings {
  // SEO - Global
  siteTitle?: string;
  siteDescription?: string;
  siteKeywords?: string;
  
  // Page Headers
  homeHeader: string;
  portfolioHeader: string;
  contactHeader: string;
  blogHeader: string;
  specializationHeaders: Record<string, string>;
  
  // Home Page
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeAboutTitle: string;
  homeAboutText: string;
  profilePic: string;
  
  // Specializations Page
  specificationsTitle: string;
  specificationsSubtitle: string;

  // Contact & Bio
  contactTitle: string;
  contactSubtitle: string;
  bio: string;
  ico: string;
  dic: string;
  address: string;
  phone: string;
  email: string;
  footerDescription: string;
  
  // Legal
  doc1Name: string;
  doc1Url: string;
  doc2Name: string;
  doc2Url: string;
  privacyContent?: string;
  termsContent?: string;

  // Socials
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;

  // Pricing
  pricingTitle: string;
  pricingSubtitle: string;
  price1Title: string;
  price1Value: string;
  price1Desc: string;
  price2Title: string;
  price2Value: string;
  price2Desc: string;
  pricingCta: string;
  
  // Extra
  backstage: string[];
}

export interface Review {
  id: string;
  author: string;
  text: string;
  rating: number;
  platform: 'google' | 'firmy' | 'manual';
  date: string;
  companyUrl?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'read' | 'replied';
}
