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

export type ProgramPageExploreProgramItem = {
  badge: string;
  badgeBackgroundColor?: string | null;
  badgeTextColor?: string | null;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  benefits: string[];
};

export type ProgramPageExploreProgramsContent = {
  eyebrow: string;
  title: string;
  items: ProgramPageExploreProgramItem[];
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
  exploreBackground: string;
  exploreEyebrowBackground: string;
  exploreEyebrowText: string;
  exploreTitleText: string;
  exploreCardBackground: string;
  exploreCardBorder: string;
  exploreCardShadow: string;
  exploreCardBadgeBackground: string;
  exploreCardBadgeText: string;
  exploreCardTitleText: string;
  exploreCardDescriptionText: string;
  exploreBenefitLabelText: string;
  exploreBenefitText: string;
  exploreBenefitIconColor: string;
  exploreCtaBackground: string;
  exploreCtaText: string;
  exploreDotActive: string;
  exploreDotInactive: string;
  exploreNavBorder: string;
  exploreNavIcon: string;
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
  explorePrograms: ProgramPageExploreProgramsContent;
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

const DEFAULT_EXPLORE_PROGRAMS_CONTENT: ProgramPageExploreProgramsContent = {
  eyebrow: 'Explore Our Program',
  title: 'Jelajahi Program Lainnya',
  items: [],
};

const pickThemeValue = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const normalizeProgramPageTheme = (value: unknown): ProgramPageTheme => {
  const theme =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<ProgramPageTheme>)
      : {};

  return {
    ...(theme as ProgramPageTheme),
    exploreBackground: pickThemeValue(theme.exploreBackground, theme.pageBackground, '#FFFFFF'),
    exploreEyebrowBackground: pickThemeValue(
      theme.exploreEyebrowBackground,
      theme.sectionBadgeBackground,
      'var(--accent-purple-color)'
    ),
    exploreEyebrowText: pickThemeValue(
      theme.exploreEyebrowText,
      theme.sectionBadgeText,
      'var(--accent-purple-light-color)'
    ),
    exploreTitleText: pickThemeValue(
      theme.exploreTitleText,
      theme.sectionHeadingText,
      '#2C2F38'
    ),
    exploreCardBackground: pickThemeValue(
      theme.exploreCardBackground,
      theme.highlightCardBackground,
      '#FFFFFF'
    ),
    exploreCardBorder: pickThemeValue(
      theme.exploreCardBorder,
      theme.highlightCardBorder,
      '#E2E8F0'
    ),
    exploreCardShadow: pickThemeValue(
      theme.exploreCardShadow,
      theme.highlightCardShadow,
      '0 28px 64px rgba(76, 64, 142, 0.1)'
    ),
    exploreCardBadgeBackground: pickThemeValue(
      theme.exploreCardBadgeBackground,
      theme.highlightLabelBackground,
      '#FFFFFF'
    ),
    exploreCardBadgeText: pickThemeValue(
      theme.exploreCardBadgeText,
      theme.highlightLabelText,
      '#171717'
    ),
    exploreCardTitleText: pickThemeValue(
      theme.exploreCardTitleText,
      theme.sectionHeadingText,
      '#2C2F38'
    ),
    exploreCardDescriptionText: pickThemeValue(
      theme.exploreCardDescriptionText,
      theme.sectionMutedText,
      '#404554'
    ),
    exploreBenefitLabelText: pickThemeValue(
      theme.exploreBenefitLabelText,
      theme.sectionHeadingText,
      '#2C2F38'
    ),
    exploreBenefitText: pickThemeValue(
      theme.exploreBenefitText,
      theme.pricingBenefitText,
      '#434A58'
    ),
    exploreBenefitIconColor: pickThemeValue(
      theme.exploreBenefitIconColor,
      theme.pricingBenefitIconColor,
      '#14B86A'
    ),
    exploreCtaBackground: pickThemeValue(
      theme.exploreCtaBackground,
      theme.pricingCtaBackground,
      '#FFD54A'
    ),
    exploreCtaText: pickThemeValue(theme.exploreCtaText, theme.pricingCtaText, '#171717'),
    exploreDotActive: pickThemeValue(theme.exploreDotActive, theme.dotActive, '#3B82F6'),
    exploreDotInactive: pickThemeValue(
      theme.exploreDotInactive,
      theme.dotInactive,
      '#BFDBFE'
    ),
    exploreNavBorder: pickThemeValue(theme.exploreNavBorder, theme.navBorder, '#BFDBFE'),
    exploreNavIcon: pickThemeValue(theme.exploreNavIcon, theme.navIcon, '#3B82F6'),
  };
};

export const normalizeProgramPageContentPayload = (
  content: ProgramPageContentPayload
): ProgramPageContentPayload => {
  const rawExplorePrograms =
    content.explorePrograms &&
    typeof content.explorePrograms === 'object' &&
    !Array.isArray(content.explorePrograms)
      ? content.explorePrograms
      : DEFAULT_EXPLORE_PROGRAMS_CONTENT;

  return {
    ...content,
    theme: normalizeProgramPageTheme(content.theme),
    explorePrograms: {
      eyebrow:
        typeof rawExplorePrograms.eyebrow === 'string' && rawExplorePrograms.eyebrow.trim()
          ? rawExplorePrograms.eyebrow.trim()
          : DEFAULT_EXPLORE_PROGRAMS_CONTENT.eyebrow,
      title:
        typeof rawExplorePrograms.title === 'string' && rawExplorePrograms.title.trim()
          ? rawExplorePrograms.title.trim()
          : DEFAULT_EXPLORE_PROGRAMS_CONTENT.title,
      items: Array.isArray(rawExplorePrograms.items)
        ? rawExplorePrograms.items.map(
          (item: ProgramPageExploreProgramItem) => ({
            ...item,
            badgeBackgroundColor:
              typeof item.badgeBackgroundColor === 'string'
                ? item.badgeBackgroundColor.trim()
                : '',
            badgeTextColor:
              typeof item.badgeTextColor === 'string'
                ? item.badgeTextColor.trim()
                : '',
            benefits: Array.isArray(item.benefits) ? item.benefits : [],
          })
        )
        : DEFAULT_EXPLORE_PROGRAMS_CONTENT.items,
    },
  };
};

const normalizeProgramPageDetail = (
  detail: ProgramPageDetailDTO
): ProgramPageDetailDTO => ({
  ...detail,
  draft_content: normalizeProgramPageContentPayload(detail.draft_content),
  published_content: detail.published_content
    ? normalizeProgramPageContentPayload(detail.published_content)
    : null,
});

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
  const response = await baseUrl.request<ProgramPageDetailResponse>(
    ENDPOINTS.PROGRAM_PAGES.DETAIL(type),
    {
      method: 'GET',
    }
  );

  return {
    ...response,
    data: normalizeProgramPageDetail(response.data),
  };
}

export async function updateProgramPage(type: ProgramPageType, payload: UpdateProgramPagePayload) {
  const response = await baseUrl.request<ProgramPageMutationResponse>(
    ENDPOINTS.PROGRAM_PAGES.UPDATE(type),
    {
      method: 'PUT',
      json: {
        ...payload,
        draft_content: payload.draft_content
          ? normalizeProgramPageContentPayload(payload.draft_content)
          : payload.draft_content,
        seo: normalizeSeoPayload(payload.seo),
      },
    }
  );

  return {
    ...response,
    data: normalizeProgramPageDetail(response.data),
  };
}

export async function publishProgramPage(type: ProgramPageType) {
  const response = await baseUrl.request<ProgramPageMutationResponse>(
    ENDPOINTS.PROGRAM_PAGES.PUBLISH(type),
    {
      method: 'PATCH',
    }
  );

  return {
    ...response,
    data: normalizeProgramPageDetail(response.data),
  };
}

export async function unpublishProgramPage(type: ProgramPageType) {
  const response = await baseUrl.request<ProgramPageMutationResponse>(
    ENDPOINTS.PROGRAM_PAGES.UNPUBLISH(type),
    {
      method: 'PATCH',
    }
  );

  return {
    ...response,
    data: normalizeProgramPageDetail(response.data),
  };
}
