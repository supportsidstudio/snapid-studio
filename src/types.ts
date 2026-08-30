export type AppTab = 'home' | 'passport' | 'documents' | 'help' | 'about' | 'legal' | 'contact' | 'blog' | 'sitemap';
export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'en' | 'hi';

export type PassportPresetId = 'india_us' | 'eu_uk' | 'oci_visa' | 'stamp';

export interface PassportSizePreset {
  id: PassportPresetId;
  nameEn: string;
  nameHi: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number; // width / height
}

export type SheetSizeId = 
  | 'size_4x6' 
  | 'size_a4' 
  | 'size_5x7' 
  | 'size_a6' 
  | 'size_a5' 
  | 'size_b5' 
  | 'size_b6' 
  | 'size_3_5x5' 
  | 'size_5x8' 
  | 'size_8x10' 
  | 'size_16_9_wide' 
  | 'size_100x148' 
  | 'env_10' 
  | 'env_dl' 
  | 'env_c6' 
  | 'size_letter' 
  | 'size_8_5x13' 
  | 'size_indian_legal' 
  | 'size_legal' 
  | 'size_a3' 
  | 'size_a3_plus' 
  | 'size_a2' 
  | 'size_b4' 
  | 'size_b3' 
  | 'size_8k' 
  | 'size_16k' 
  | 'size_user_defined' 
  | 'single'
  | string;

export interface SheetSizePreset {
  id: SheetSizeId;
  nameEn: string;
  nameHi: string;
  widthMm: number;
  heightMm: number;
  photosCount?: number;
  cols?: number;
  category?: string;
}

export type DocumentTypeId = 'aadhaar' | 'pan' | 'janaadhaar' | 'voterid' | 'dl';

export interface DocumentPreset {
  id: DocumentTypeId;
  nameEn: string;
  nameHi: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
}

export type DocumentLayoutPresetId = 'side_by_side' | 'stacked' | 'split';

export interface ImageCropState {
  x: number; // percentage offset -50% to 50%
  y: number; // percentage offset -50% to 50%
  zoom: number; // scale factor (e.g. 1.0 to 3.0)
  rotation: number; // degrees 0, 90, 180, 270 or slide -180 to 180
}
