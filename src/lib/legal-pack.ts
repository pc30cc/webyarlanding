/**
 * متن صفحات حقوقی و پشتیبانی (/privacy، /terms، /help) برای زبان‌هایی غیر از فارسی و انگلیسی.
 * فارسی و انگلیسی متن خودشان را در همان صفحات و legal-en.ts دارند.
 */
import type { LegalSection } from "./legal-en";

export interface LegalFaq {
  q: string;
  a: string;
}

export interface LegalPack {
  /** تاریخ اجرا به زبان همان صفحه */
  effectiveDate: string;
  /** «تاریخ اجرا: … · برند» */
  effectiveLine: (date: string, brand: string) => string;
  home: string;

  privacyTitle: string;
  privacyMetaTitle: string;
  privacyMetaDescription: string;
  privacySections: (brand: string, email: string, address: string) => LegalSection[];

  termsTitle: string;
  termsMetaTitle: string;
  termsMetaDescription: string;
  termsSections: (brand: string, email: string) => LegalSection[];

  helpMetaTitle: string;
  helpMetaDescription: string;
  /** نام صفحه تماس در JSON-LD، مثل «Webyar Support» */
  supportName: (brand: string) => string;
  /** نام کوتاه صفحه در مسیر راهنما (breadcrumb) */
  supportCrumb: string;
  helpTitle: string;
  helpIntro: (brand: string) => string;
  supportEmail: string;
  supportEmailNote: string;
  responseTime: string;
  responseTimeValue: string;
  phoneLabel: string;
  addressLabel: string;
  accountDeletion: string;
  /** موضوع ایمیل درخواست حذف حساب (در لینک mailto) */
  deletionSubject: string;
  /** متن پیش و پس از آدرس ایمیل در کارت حذف حساب */
  deletionBefore: string;
  deletionAfter: string;
  policies: string;
  privacyLink: string;
  termsLink: string;
  faqTitle: string;
  faqs: LegalFaq[];
  /** متن پیش و پس از آدرس ایمیل در پاراگراف پایانی («هنوز مشکل دارید؟ …») */
  stuckBefore: string;
  stuckAfter: string;
}
