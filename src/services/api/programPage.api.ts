import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

export type ProgramPageType = 'regular' | 'special-need' | 'hobby';
export type ProgramPageStatus = 'draft' | 'published';
export type ProgramPageMetricIconKey = 'students' | 'stage' | 'satisfaction';
export type ProgramPageBenefitTone = 'yes' | 'sometimes' | 'no';

export type ProgramPageFloatingBadge = {
  label: string;
};

export type ProgramPageHeroContent = {
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaMessage: string;
  imageSrc: string;
  imageAlt: string;
  imageObjectPosition?: string | null;
  floatingBadges: ProgramPageFloatingBadge[];
};

export type ProgramPageHighlightItem = {
  label: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageObjectPosition?: string | null;
};

export type ProgramPageHighlightsContent = {
  eyebrow: string;
  title: string;
  items: ProgramPageHighlightItem[];
};

export type ProgramPageStatsItem = {
  icon: ProgramPageMetricIconKey;
  value: string;
  label: string;
};

export type ProgramPageStatsContent = {
  eyebrow: string;
  title: string;
  description: string;
  items: ProgramPageStatsItem[];
};

export type ProgramPageBenefitStatus = {
  tone: ProgramPageBenefitTone;
  label: string;
};

export type ProgramPageBenefitComparisonRow = {
  feature: string;
  program: ProgramPageBenefitStatus;
  competitor: ProgramPageBenefitStatus;
};

export type ProgramPageBenefitsComparisonContent = {
  eyebrow: string;
  title: string;
  brandLabel: string;
  brandLogoSrc: string;
  brandLogoAlt: string;
  competitorLabel: string;
  rows: ProgramPageBenefitComparisonRow[];
};

export type ProgramPagePricingPlan = {
  badge: string;
  description: string;
  discountLabel: string;
  originalPrice: string;
  startingFromLabel: string;
  startingPrice: string;
  billingCycle: string;
  registrationNote: string;
  registrationTooltip: string;
  ctaLabel: string;
  ctaHref: string;
  benefits: string[];
};

export type ProgramPagePricingContent = {
  eyebrow: string;
  title: string;
  plans: ProgramPagePricingPlan[];
};

export type ProgramPageTheme = {
  pageBackground: string;
  heroBackground: string;
  heroGlow: string;
  heroBadgeBackground: string;
  heroBadgeText: string;
  heroTitleText: string;
  heroDescriptionText: string;
  heroCtaBackground: string;
  heroCtaText: string;
  heroImageAccent: string;
  floatingBadgeBackground: string;
  floatingBadgeText: string;
  floatingBadgeShadow: string;
  floatingBadgeIconColor: string;
  sectionBadgeBackground: string;
  sectionBadgeText: string;
  sectionHeadingText: string;
  sectionMutedText: string;
  highlightCardBackground: string;
  highlightCardBorder: string;
  highlightCardShadow: string;
  highlightImagePanel: string;
  highlightImageAccent: string;
  highlightLabelBackground: string;
  highlightLabelText: string;
  dotActive: string;
  dotInactive: string;
  navBorder: string;
  navIcon: string;
  statsBackground: string;
  statsBadgeBackground: string;
  statsBadgeText: string;
  statsTitleText: string;
  statsDescriptionText: string;
  statsMetricValueText: string;
  statsMetricLabelText: string;
  statsIconColor: string;
  comparisonHeaderBackground: string;
  comparisonTableBorder: string;
  comparisonRowAltBackground: string;
  comparisonHeaderText: string;
  comparisonVsText: string;
  comparisonFeatureText: string;
  comparisonStatusText: string;
  comparisonStatusYesColor: string;
  comparisonStatusSometimesColor: string;
  comparisonStatusNoColor: string;
  pricingBackground: string;
  pricingBadgeBackground: string;
  pricingBadgeText: string;
  pricingTitleText: string;
  pricingCardBackground: string;
  pricingCardBorder: string;
  pricingCardShadow: string;
  pricingPlanBadgeBackground: string;
  pricingPlanBadgeText: string;
  pricingDescriptionText: string;
  pricingDiscountBackground: string;
  pricingDiscountText: string;
  pricingStrikePriceText: string;
  pricingPriceText: string;
  pricingPriceMutedText: string;
  pricingInfoIconColor: string;
  pricingDivider: string;
  pricingBenefitLabelText: string;
  pricingBenefitText: string;
  pricingBenefitIconColor: string;
  pricingCtaBackground: string;
  pricingCtaText: string;
};

export type ProgramPageSeoPayload = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
};

export type ProgramPageContentPayload = {
  type: ProgramPageType;
  label: string;
  theme: ProgramPageTheme;
  hero: ProgramPageHeroContent;
  highlights: ProgramPageHighlightsContent;
  stats: ProgramPageStatsContent;
  benefitsComparison: ProgramPageBenefitsComparisonContent;
  pricing: ProgramPagePricingContent;
};

export type ProgramPageSummaryDTO = {
  id: number;
  type: ProgramPageType;
  status: ProgramPageStatus;
  content_schema_version: number;
  label?: string | null;
  hero_badge?: string | null;
  hero_title?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProgramPageDetailDTO = {
  id: number;
  type: ProgramPageType;
  status: ProgramPageStatus;
  content_schema_version: number;
  draft_content: ProgramPageContentPayload;
  published_content: ProgramPageContentPayload | null;
  seo: ProgramPageSeoPayload | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProgramPageListResponse = {
  page: number;
  limit: number;
  total: number;
  data: ProgramPageSummaryDTO[];
};

export type ProgramPageDetailResponse = {
  data: ProgramPageDetailDTO;
};

export type ProgramPageMutationResponse = {
  message: string;
  data: ProgramPageDetailDTO;
};

export type UpdateProgramPagePayload = {
  content_schema_version?: number;
  draft_content?: ProgramPageContentPayload;
  seo?: ProgramPageSeoPayload | null;
};

const cleanNullableText = (value: unknown) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const normalizeSeoPayload = (
  payload?: ProgramPageSeoPayload | null
): ProgramPageSeoPayload | null => {
  if (!payload) return null;

  const normalized: ProgramPageSeoPayload = {
    metaTitle: cleanNullableText(payload.metaTitle),
    metaDescription: cleanNullableText(payload.metaDescription),
    ogImage: cleanNullableText(payload.ogImage),
    canonicalUrl: cleanNullableText(payload.canonicalUrl),
  };

  const hasValue = Object.values(normalized).some((value) => value);
  return hasValue ? normalized : null;
};

export async function listProgramPages() {
  return baseUrl.request<ProgramPageListResponse>(ENDPOINTS.PROGRAM_PAGES.LIST, {
    method: 'GET',
  });
}

export async function getProgramPageDetail(type: ProgramPageType) {
  return baseUrl.request<ProgramPageDetailResponse>(ENDPOINTS.PROGRAM_PAGES.DETAIL(type), {
    method: 'GET',
  });
}

export async function updateProgramPage(type: ProgramPageType, payload: UpdateProgramPagePayload) {
  return baseUrl.request<ProgramPageMutationResponse>(ENDPOINTS.PROGRAM_PAGES.UPDATE(type), {
    method: 'PUT',
    json: {
      ...payload,
      seo: normalizeSeoPayload(payload.seo),
    },
  });
}

export async function publishProgramPage(type: ProgramPageType) {
  return baseUrl.request<ProgramPageMutationResponse>(ENDPOINTS.PROGRAM_PAGES.PUBLISH(type), {
    method: 'PATCH',
  });
}

export async function unpublishProgramPage(type: ProgramPageType) {
  return baseUrl.request<ProgramPageMutationResponse>(ENDPOINTS.PROGRAM_PAGES.UNPUBLISH(type), {
    method: 'PATCH',
  });
}
