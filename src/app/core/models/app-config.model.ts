export interface AppConfig {
  version: string;
  phone: string;
  email: string;
  whatsapp: string;
  androidUrl: string;
  iosUrl: string;
  shareUrl: string;
  banners: string[];
}

export interface AppConfigResponse {
  success: boolean;
  message?: string;
  data: AppConfig;
}
