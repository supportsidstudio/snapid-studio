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

export type SheetSizeId = 'single' | 'size_4x6' | 'size_a4';

export interface SheetSizePreset {
  id: SheetSizeId;
  nameEn: string;
  nameHi: string;
  widthMm: number;
  heightMm: number;
  photosCount: number;
  cols: number;
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
