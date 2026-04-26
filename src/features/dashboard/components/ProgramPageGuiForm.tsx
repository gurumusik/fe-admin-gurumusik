import React from 'react';
import { RiAddLine, RiDeleteBin6Line } from 'react-icons/ri';

import ProgramPageImageUploadField from '@/features/dashboard/components/ProgramPageImageUploadField';
import StringItemsInput from '@/features/dashboard/components/StringItemsInput';
import type {
  ProgramPageBenefitTone,
  ProgramPageContentPayload,
  ProgramPageMetricIconKey,
  ProgramPageTheme,
} from '@/services/api/programPage.api';

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

const inputClass =
  'h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/35 disabled:bg-neutral-50';
const textAreaClass =
  'w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/35 disabled:bg-neutral-50';
const selectClass =
  'h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/35 disabled:bg-neutral-50';

type ProgramPageGuiFormProps = {
  value: ProgramPageContentPayload;
  onChange: (next: ProgramPageContentPayload) => void;
  disabled?: boolean;
  mode?: 'content' | 'style';
};

type ThemeFieldSpec = {
  key: keyof ProgramPageTheme;
  label: string;
  helperText?: string;
  mode?: 'paint' | 'text';
};

const METRIC_ICON_OPTIONS: Array<{ value: ProgramPageMetricIconKey; label: string }> = [
  { value: 'students', label: 'Students' },
  { value: 'stage', label: 'Stage' },
  { value: 'satisfaction', label: 'Satisfaction' },
];

const BENEFIT_TONE_OPTIONS: Array<{ value: ProgramPageBenefitTone; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'no', label: 'No' },
];

const COLOR_TOKEN_GROUPS: Array<{
  label: string;
  options: Array<{ label: string; value: string }>;
}> = [
  {
    label: 'Brand',
    options: [
      { label: 'Primary Color', value: 'var(--primary-color)' },
      { label: 'Primary Light Color', value: 'var(--primary-light-color)' },
      { label: 'Secondary Color', value: 'var(--secondary-color)' },
      { label: 'Secondary Light Color', value: 'var(--secondary-light-color)' },
    ],
  },
  {
    label: 'Accent',
    options: [
      { label: 'Accent Purple', value: 'var(--accent-purple-color)' },
      { label: 'Accent Purple Light', value: 'var(--accent-purple-light-color)' },
      { label: 'Accent Red', value: 'var(--accent-red-color)' },
      { label: 'Accent Red Light', value: 'var(--accent-red-light-color)' },
      { label: 'Accent Orange', value: 'var(--accent-orange-color)' },
      { label: 'Accent Orange Light', value: 'var(--accent-orange-light-color)' },
      { label: 'Accent Blue', value: 'var(--accent-blue-color)' },
      { label: 'Accent Blue Light', value: 'var(--accent-blue-light-color)' },
      { label: 'Accent Green', value: 'var(--accent-green-color)' },
      { label: 'Accent Green Light', value: 'var(--accent-green-light-color)' },
    ],
  },
  {
    label: 'Neutral',
    options: [
      { label: 'Neutral 50', value: 'var(--neutral-50)' },
      { label: 'Neutral 100', value: 'var(--neutral-100)' },
      { label: 'Neutral 200', value: 'var(--neutral-200)' },
      { label: 'Neutral 300', value: 'var(--neutral-300)' },
      { label: 'Neutral 400', value: 'var(--neutral-400)' },
      { label: 'Neutral 500', value: 'var(--neutral-500)' },
      { label: 'Neutral 600', value: 'var(--neutral-600)' },
      { label: 'Neutral 700', value: 'var(--neutral-700)' },
      { label: 'Neutral 800', value: 'var(--neutral-800)' },
      { label: 'Neutral 900', value: 'var(--neutral-900)' },
      { label: 'Neutral 950', value: 'var(--neutral-950)' },
    ],
  },
];

const COLOR_TOKEN_VALUES = new Set(
  COLOR_TOKEN_GROUPS.flatMap((group) => group.options.map((option) => option.value))
);

const THEME_FIELD_GROUPS: Array<{
  id: string;
  title: string;
  description: string;
  fields: ThemeFieldSpec[];
}> = [
  {
    id: 'section-style-general',
    title: 'General',
    description: 'Warna dasar halaman dan tipografi section umum.',
    fields: [
      { key: 'pageBackground', label: 'Page Background', mode: 'paint' },
      { key: 'sectionHeadingText', label: 'Section Heading Text', mode: 'paint' },
      { key: 'sectionMutedText', label: 'Section Muted Text', mode: 'paint' },
    ],
  },
  {
    id: 'section-style-eyebrow',
    title: 'Eyebrow / Chip Colors',
    description: 'Warna background dan teks untuk chip kecil di atas judul tiap section.',
    fields: [
      { key: 'heroBadgeBackground', label: 'Hero Eyebrow Background', mode: 'paint' },
      { key: 'heroBadgeText', label: 'Hero Eyebrow Text', mode: 'paint' },
      {
        key: 'sectionBadgeBackground',
        label: 'Highlights & Benefits Eyebrow Background',
        helperText: 'Dipakai oleh chip seperti "Get the highlights" dan "Benefits".',
        mode: 'paint',
      },
      {
        key: 'sectionBadgeText',
        label: 'Highlights & Benefits Eyebrow Text',
        helperText: 'Dipakai oleh chip seperti "Get the highlights" dan "Benefits".',
        mode: 'paint',
      },
      { key: 'statsBadgeBackground', label: 'Stats Eyebrow Background', mode: 'paint' },
      { key: 'statsBadgeText', label: 'Stats Eyebrow Text', mode: 'paint' },
      { key: 'pricingBadgeBackground', label: 'Pricing Eyebrow Background', mode: 'paint' },
      { key: 'pricingBadgeText', label: 'Pricing Eyebrow Text', mode: 'paint' },
      { key: 'exploreEyebrowBackground', label: 'Explore Eyebrow Background', mode: 'paint' },
      { key: 'exploreEyebrowText', label: 'Explore Eyebrow Text', mode: 'paint' },
    ],
  },
  {
    id: 'section-style-hero',
    title: 'Hero',
    description: 'Warna hero, CTA, dan floating badge.',
    fields: [
      { key: 'heroBackground', label: 'Hero Background', helperText: 'Bisa warna solid atau gradient.', mode: 'paint' },
      { key: 'heroGlow', label: 'Hero Glow', helperText: 'Biasanya rgba(...)', mode: 'paint' },
      { key: 'heroTitleText', label: 'Hero Title Text', mode: 'paint' },
      { key: 'heroDescriptionText', label: 'Hero Description Text', mode: 'paint' },
      { key: 'heroCtaBackground', label: 'Hero CTA Background', mode: 'paint' },
      { key: 'heroCtaText', label: 'Hero CTA Text', mode: 'paint' },
      { key: 'heroImageAccent', label: 'Hero Image Accent', mode: 'paint' },
      { key: 'floatingBadgeBackground', label: 'Floating Badge Background', mode: 'paint' },
      { key: 'floatingBadgeText', label: 'Floating Badge Text', mode: 'paint' },
      { key: 'floatingBadgeShadow', label: 'Floating Badge Shadow', helperText: 'Contoh: 0 18px 40px rgba(...)', mode: 'text' },
      { key: 'floatingBadgeIconColor', label: 'Floating Badge Icon Color', mode: 'paint' },
    ],
  },
  {
    id: 'section-style-highlights',
    title: 'Highlights',
    description: 'Style card dan navigasi section benefit/highlights.',
    fields: [
      { key: 'highlightCardBackground', label: 'Highlight Card Background', mode: 'paint' },
      { key: 'highlightCardBorder', label: 'Highlight Card Border', mode: 'paint' },
      { key: 'highlightCardShadow', label: 'Highlight Card Shadow', mode: 'text' },
      { key: 'highlightImagePanel', label: 'Highlight Image Panel', helperText: 'Bisa gradient.', mode: 'paint' },
      { key: 'highlightImageAccent', label: 'Highlight Image Accent', mode: 'paint' },
      { key: 'highlightLabelBackground', label: 'Highlight Label Background', mode: 'paint' },
      { key: 'highlightLabelText', label: 'Highlight Label Text', mode: 'paint' },
      { key: 'dotActive', label: 'Dot Active', mode: 'paint' },
      { key: 'dotInactive', label: 'Dot Inactive', mode: 'paint' },
      { key: 'navBorder', label: 'Navigation Border', mode: 'paint' },
      { key: 'navIcon', label: 'Navigation Icon', mode: 'paint' },
    ],
  },
  {
    id: 'section-style-stats',
    title: 'Stats',
    description: 'Warna section ungu statistik.',
    fields: [
      { key: 'statsBackground', label: 'Stats Background', mode: 'paint' },
      { key: 'statsTitleText', label: 'Stats Title Text', mode: 'paint' },
      { key: 'statsDescriptionText', label: 'Stats Description Text', mode: 'paint' },
      { key: 'statsMetricValueText', label: 'Stats Metric Value Text', mode: 'paint' },
      { key: 'statsMetricLabelText', label: 'Stats Metric Label Text', mode: 'paint' },
      { key: 'statsIconColor', label: 'Stats Icon Color', mode: 'paint' },
    ],
  },
  {
    id: 'section-style-comparison',
    title: 'Comparison',
    description: 'Warna tabel comparison benefit.',
    fields: [
      { key: 'comparisonHeaderBackground', label: 'Comparison Header Background', mode: 'paint' },
      { key: 'comparisonTableBorder', label: 'Comparison Table Border', mode: 'paint' },
      { key: 'comparisonRowAltBackground', label: 'Comparison Alternate Row Background', mode: 'paint' },
      { key: 'comparisonHeaderText', label: 'Comparison Header Text', mode: 'paint' },
      { key: 'comparisonVsText', label: 'Comparison Vs Text', mode: 'paint' },
      { key: 'comparisonFeatureText', label: 'Comparison Feature Text', mode: 'paint' },
      { key: 'comparisonStatusText', label: 'Comparison Status Text', mode: 'paint' },
      { key: 'comparisonStatusYesColor', label: 'Comparison Yes Color', mode: 'paint' },
      { key: 'comparisonStatusSometimesColor', label: 'Comparison Sometimes Color', mode: 'paint' },
      { key: 'comparisonStatusNoColor', label: 'Comparison No Color', mode: 'paint' },
    ],
  },
  {
    id: 'section-style-pricing',
    title: 'Pricing',
    description: 'Warna card pricing dan CTA section harga.',
    fields: [
      { key: 'pricingBackground', label: 'Pricing Background', mode: 'paint' },
      { key: 'pricingTitleText', label: 'Pricing Title Text', mode: 'paint' },
      { key: 'pricingCardBackground', label: 'Pricing Card Background', mode: 'paint' },
      { key: 'pricingCardBorder', label: 'Pricing Card Border', mode: 'paint' },
      { key: 'pricingCardShadow', label: 'Pricing Card Shadow', mode: 'text' },
      { key: 'pricingPlanBadgeBackground', label: 'Pricing Plan Badge Background', mode: 'paint' },
      { key: 'pricingPlanBadgeText', label: 'Pricing Plan Badge Text', mode: 'paint' },
      { key: 'pricingDescriptionText', label: 'Pricing Description Text', mode: 'paint' },
      { key: 'pricingDiscountBackground', label: 'Pricing Discount Background', mode: 'paint' },
      { key: 'pricingDiscountText', label: 'Pricing Discount Text', mode: 'paint' },
      { key: 'pricingStrikePriceText', label: 'Pricing Strike Price Text', mode: 'paint' },
      { key: 'pricingPriceText', label: 'Pricing Price Text', mode: 'paint' },
      { key: 'pricingPriceMutedText', label: 'Pricing Price Muted Text', mode: 'paint' },
      { key: 'pricingInfoIconColor', label: 'Pricing Info Icon Color', mode: 'paint' },
      { key: 'pricingDivider', label: 'Pricing Divider', mode: 'paint' },
      { key: 'pricingBenefitLabelText', label: 'Pricing Benefit Label Text', mode: 'paint' },
      { key: 'pricingBenefitText', label: 'Pricing Benefit Text', mode: 'paint' },
      { key: 'pricingBenefitIconColor', label: 'Pricing Benefit Icon Color', mode: 'paint' },
      { key: 'pricingCtaBackground', label: 'Pricing CTA Background', mode: 'paint' },
      { key: 'pricingCtaText', label: 'Pricing CTA Text', mode: 'paint' },
    ],
  },
  {
    id: 'section-style-explore-programs',
    title: 'Explore Programs',
    description:
      'Warna section explore, badge/eyebrow, isi card, CTA, dan navigasi carousel mobile.',
    fields: [
      { key: 'exploreBackground', label: 'Explore Background', mode: 'paint' },
      { key: 'exploreTitleText', label: 'Explore Title Text', mode: 'paint' },
      { key: 'exploreCardBackground', label: 'Explore Card Background', mode: 'paint' },
      { key: 'exploreCardBorder', label: 'Explore Card Border', mode: 'paint' },
      { key: 'exploreCardShadow', label: 'Explore Card Shadow', mode: 'text' },
      { key: 'exploreCardBadgeBackground', label: 'Explore Card Badge Background', mode: 'paint' },
      { key: 'exploreCardBadgeText', label: 'Explore Card Badge Text', mode: 'paint' },
      { key: 'exploreCardTitleText', label: 'Explore Card Title Text', mode: 'paint' },
      {
        key: 'exploreCardDescriptionText',
        label: 'Explore Card Description Text',
        mode: 'paint',
      },
      { key: 'exploreBenefitLabelText', label: 'Explore Benefit Label Text', mode: 'paint' },
      { key: 'exploreBenefitText', label: 'Explore Benefit Text', mode: 'paint' },
      { key: 'exploreBenefitIconColor', label: 'Explore Benefit Icon Color', mode: 'paint' },
      { key: 'exploreCtaBackground', label: 'Explore CTA Background', mode: 'paint' },
      { key: 'exploreCtaText', label: 'Explore CTA Text', mode: 'paint' },
      { key: 'exploreDotActive', label: 'Explore Dot Active', mode: 'paint' },
      { key: 'exploreDotInactive', label: 'Explore Dot Inactive', mode: 'paint' },
      { key: 'exploreNavBorder', label: 'Explore Navigation Border', mode: 'paint' },
      { key: 'exploreNavIcon', label: 'Explore Navigation Icon', mode: 'paint' },
    ],
  },
];

const isHexColor = (value: string) => /^#(?:[0-9A-F]{3}){1,2}$/i.test(value.trim());

const SectionCard = ({
  title,
  description,
  id,
  children,
}: {
  title: string;
  description: string;
  id?: string;
  children: React.ReactNode;
}) => (
  <section
    id={id}
    className="scroll-mt-28 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6"
  >
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mt-1 text-sm text-neutral-600">{description}</p>
    </div>
    {children}
  </section>
);

const Field = ({
  label,
  helperText,
  children,
}: {
  label: string;
  helperText?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <label className="block space-y-2">
    <span className="text-sm font-medium text-neutral-800">{label}</span>
    {children}
    {helperText ? <span className="block text-xs text-neutral-500">{helperText}</span> : null}
  </label>
);

const IconButton = ({
  onClick,
  children,
  variant = 'primary',
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cls(
      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60',
      variant === 'danger'
        ? 'bg-red-50 text-red-700 hover:bg-red-100'
        : 'bg-[var(--secondary-color)] text-white hover:brightness-95'
    )}
  >
    {children}
  </button>
);

const ThemeFieldInput = ({
  label,
  value,
  helperText,
  mode,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  helperText?: string;
  mode?: 'paint' | 'text';
  disabled?: boolean;
  onChange: (next: string) => void;
}) => {
  const showPreview = mode === 'paint';
  const showColorPicker = isHexColor(value);
  const selectedTokenValue = COLOR_TOKEN_VALUES.has(value.trim()) ? value.trim() : '';

  return (
    <Field label={label} helperText={helperText}>
      <div className="space-y-2">
        {mode === 'paint' ? (
          <select
            value={selectedTokenValue}
            disabled={disabled}
            onChange={(event) => {
              if (event.target.value) {
                onChange(event.target.value);
              }
            }}
            className={selectClass}
          >
            <option value="">Custom / manual value</option>
            {COLOR_TOKEN_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        ) : null}

        <div className="flex items-center gap-2">
          {showPreview ? (
            <div
              className="h-11 w-11 shrink-0 rounded-xl border border-neutral-200 bg-white"
              style={{ background: value || undefined }}
              aria-hidden="true"
            />
          ) : null}
          {showColorPicker ? (
            <input
              type="color"
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              className="h-11 w-14 rounded-xl border border-neutral-300 bg-white p-1"
            />
          ) : null}
          <input
            type="text"
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </Field>
  );
};

export default function ProgramPageGuiForm({
  value,
  onChange,
  disabled,
  mode = 'content',
}: ProgramPageGuiFormProps) {
  const updateContent = <K extends keyof ProgramPageContentPayload>(
    key: K,
    nextValue: ProgramPageContentPayload[K]
  ) => {
    onChange({ ...value, [key]: nextValue });
  };

  const updateHero = <K extends keyof ProgramPageContentPayload['hero']>(
    key: K,
    nextValue: ProgramPageContentPayload['hero'][K]
  ) => {
    updateContent('hero', { ...value.hero, [key]: nextValue });
  };

  const updateHighlights = <K extends keyof ProgramPageContentPayload['highlights']>(
    key: K,
    nextValue: ProgramPageContentPayload['highlights'][K]
  ) => {
    updateContent('highlights', { ...value.highlights, [key]: nextValue });
  };

  const updateStats = <K extends keyof ProgramPageContentPayload['stats']>(
    key: K,
    nextValue: ProgramPageContentPayload['stats'][K]
  ) => {
    updateContent('stats', { ...value.stats, [key]: nextValue });
  };

  const updateBenefitsComparison = <
    K extends keyof ProgramPageContentPayload['benefitsComparison']
  >(
    key: K,
    nextValue: ProgramPageContentPayload['benefitsComparison'][K]
  ) => {
    updateContent('benefitsComparison', {
      ...value.benefitsComparison,
      [key]: nextValue,
    });
  };

  const updatePricing = <K extends keyof ProgramPageContentPayload['pricing']>(
    key: K,
    nextValue: ProgramPageContentPayload['pricing'][K]
  ) => {
    updateContent('pricing', { ...value.pricing, [key]: nextValue });
  };

  const updateExplorePrograms = <
    K extends keyof ProgramPageContentPayload['explorePrograms']
  >(
    key: K,
    nextValue: ProgramPageContentPayload['explorePrograms'][K]
  ) => {
    updateContent('explorePrograms', {
      ...value.explorePrograms,
      [key]: nextValue,
    });
  };

  const updateTheme = <K extends keyof ProgramPageTheme>(key: K, nextValue: string) => {
    updateContent('theme', { ...value.theme, [key]: nextValue });
  };

  const updateHighlightItem = (
    index: number,
    patch: Partial<ProgramPageContentPayload['highlights']['items'][number]>
  ) => {
    const nextItems = value.highlights.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    );
    updateHighlights('items', nextItems);
  };

  const updateStatsItem = (
    index: number,
    patch: Partial<ProgramPageContentPayload['stats']['items'][number]>
  ) => {
    const nextItems = value.stats.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    );
    updateStats('items', nextItems);
  };

  const updateComparisonRow = (
    index: number,
    patch: Partial<ProgramPageContentPayload['benefitsComparison']['rows'][number]>
  ) => {
    const nextRows = value.benefitsComparison.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row
    );
    updateBenefitsComparison('rows', nextRows);
  };

  const updatePricingPlan = (
    index: number,
    patch: Partial<ProgramPageContentPayload['pricing']['plans'][number]>
  ) => {
    const nextPlans = value.pricing.plans.map((plan, planIndex) =>
      planIndex === index ? { ...plan, ...patch } : plan
    );
    updatePricing('plans', nextPlans);
  };

  const updateExploreProgramItem = (
    index: number,
    patch: Partial<ProgramPageContentPayload['explorePrograms']['items'][number]>
  ) => {
    const nextItems = value.explorePrograms.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    );
    updateExplorePrograms('items', nextItems);
  };

  const isContentMode = mode === 'content';
  const isStyleMode = mode === 'style';

  return (
    <div className="space-y-6">
      {isContentMode ? (
        <>
          <SectionCard
            id="section-page-identity"
            title="Page Identity"
            description="Informasi dasar page program. Label ini dipakai juga sebagai ringkasan di admin."
          >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type">
            <input type="text" value={value.type} disabled className={inputClass} />
          </Field>
          <Field label="Label Program">
            <input
              type="text"
              value={value.label}
              disabled={disabled}
              onChange={(event) => updateContent('label', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
          </SectionCard>

          <SectionCard
            id="section-hero"
            title="Hero Section"
            description="Konten section pertama: badge, judul, deskripsi, CTA, dan gambar utama."
          >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Badge">
            <input
              type="text"
              value={value.hero.badge}
              disabled={disabled}
              onChange={(event) => updateHero('badge', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="CTA Label">
            <input
              type="text"
              value={value.hero.ctaLabel}
              disabled={disabled}
              onChange={(event) => updateHero('ctaLabel', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Hero Title">
            <textarea
              rows={3}
              value={value.hero.title}
              disabled={disabled}
              onChange={(event) => updateHero('title', event.target.value)}
              className={textAreaClass}
            />
          </Field>
          <Field label="Hero Description">
            <textarea
              rows={4}
              value={value.hero.description}
              disabled={disabled}
              onChange={(event) => updateHero('description', event.target.value)}
              className={textAreaClass}
            />
          </Field>
          <Field label="CTA Message" helperText="Pesan yang akan dikirim saat CTA diklik.">
            <textarea
              rows={4}
              value={value.hero.ctaMessage}
              disabled={disabled}
              onChange={(event) => updateHero('ctaMessage', event.target.value)}
              className={textAreaClass}
            />
          </Field>
          <div className="grid gap-4">
            <ProgramPageImageUploadField
              label="Hero Image"
              value={value.hero.imageSrc}
              disabled={disabled}
              previewAlt={value.hero.imageAlt || value.label || 'Hero image'}
              onChange={(next) => updateHero('imageSrc', next)}
            />
            <Field label="Image Alt">
              <input
                type="text"
                value={value.hero.imageAlt}
                disabled={disabled}
                onChange={(event) => updateHero('imageAlt', event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Image Object Position">
              <input
                type="text"
                value={value.hero.imageObjectPosition ?? ''}
                disabled={disabled}
                onChange={(event) => updateHero('imageObjectPosition', event.target.value)}
                className={inputClass}
                placeholder="Contoh: 84% center"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6">
          <StringItemsInput
            label="Floating Badges"
            value={value.hero.floatingBadges.map((item) => item.label)}
            onChange={(next) =>
              updateHero(
                'floatingBadges',
                next.map((label) => ({ label }))
              )
            }
            placeholder="Contoh: Professional"
            addLabel="Tambah Badge"
            disabled={disabled}
          />
        </div>
          </SectionCard>

          <SectionCard
            id="section-highlights"
            title="Highlights Section"
            description="Benefit slider / highlights section setelah hero."
          >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow">
            <input
              type="text"
              value={value.highlights.eyebrow}
              disabled={disabled}
              onChange={(event) => updateHighlights('eyebrow', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Section Title">
            <input
              type="text"
              value={value.highlights.title}
              disabled={disabled}
              onChange={(event) => updateHighlights('title', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-6 space-y-4">
          {value.highlights.items.map((item, index) => (
            <div key={`highlight-${index}`} className="rounded-2xl border border-neutral-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-neutral-900">
                  Highlight #{index + 1}
                </div>
                <IconButton
                  variant="danger"
                  disabled={disabled || value.highlights.items.length <= 1}
                  onClick={() =>
                    updateHighlights(
                      'items',
                      value.highlights.items.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                >
                  <RiDeleteBin6Line />
                  Hapus
                </IconButton>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Label">
                  <input
                    type="text"
                    value={item.label}
                    disabled={disabled}
                    onChange={(event) =>
                      updateHighlightItem(index, { label: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <ProgramPageImageUploadField
                  label="Highlight Image"
                  value={item.imageSrc}
                  disabled={disabled}
                  previewAlt={item.imageAlt || item.label || `Highlight ${index + 1}`}
                  onChange={(next) => updateHighlightItem(index, { imageSrc: next })}
                />
                <Field label="Description">
                  <textarea
                    rows={4}
                    value={item.description}
                    disabled={disabled}
                    onChange={(event) =>
                      updateHighlightItem(index, { description: event.target.value })
                    }
                    className={textAreaClass}
                  />
                </Field>
                <div className="grid gap-4">
                  <Field label="Image Alt">
                    <input
                      type="text"
                      value={item.imageAlt}
                      disabled={disabled}
                      onChange={(event) =>
                        updateHighlightItem(index, { imageAlt: event.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Image Object Position">
                    <input
                      type="text"
                      value={item.imageObjectPosition ?? ''}
                      disabled={disabled}
                      onChange={(event) =>
                        updateHighlightItem(index, {
                          imageObjectPosition: event.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="Contoh: 86% center"
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <IconButton
            disabled={disabled}
            onClick={() =>
              updateHighlights('items', [
                ...value.highlights.items,
                {
                  label: '',
                  description: '',
                  imageSrc: '/assets/images/default_noimg.png',
                  imageAlt: '',
                  imageObjectPosition: '',
                },
              ])
            }
          >
            <RiAddLine />
            Tambah Highlight
          </IconButton>
        </div>
          </SectionCard>

          <SectionCard
            id="section-stats"
            title="Stats Section"
            description="Section statistik hasil murid / parents satisfaction."
          >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow">
            <input
              type="text"
              value={value.stats.eyebrow}
              disabled={disabled}
              onChange={(event) => updateStats('eyebrow', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Section Title">
            <input
              type="text"
              value={value.stats.title}
              disabled={disabled}
              onChange={(event) => updateStats('title', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Section Description">
            <textarea
              rows={3}
              value={value.stats.description}
              disabled={disabled}
              onChange={(event) => updateStats('description', event.target.value)}
              className={textAreaClass}
            />
          </Field>
        </div>

        <div className="mt-6 space-y-4">
          {value.stats.items.map((item, index) => (
            <div key={`stats-${index}`} className="rounded-2xl border border-neutral-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-neutral-900">
                  Stat #{index + 1}
                </div>
                <IconButton
                  variant="danger"
                  disabled={disabled || value.stats.items.length <= 1}
                  onClick={() =>
                    updateStats(
                      'items',
                      value.stats.items.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                >
                  <RiDeleteBin6Line />
                  Hapus
                </IconButton>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Icon">
                  <select
                    value={item.icon}
                    disabled={disabled}
                    onChange={(event) =>
                      updateStatsItem(index, {
                        icon: event.target.value as ProgramPageMetricIconKey,
                      })
                    }
                    className={selectClass}
                  >
                    {METRIC_ICON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Value">
                  <input
                    type="text"
                    value={item.value}
                    disabled={disabled}
                    onChange={(event) =>
                      updateStatsItem(index, { value: event.target.value })
                    }
                    className={inputClass}
                    placeholder="Contoh: 300+"
                  />
                </Field>
                <Field label="Label">
                  <input
                    type="text"
                    value={item.label}
                    disabled={disabled}
                    onChange={(event) =>
                      updateStatsItem(index, { label: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <IconButton
            disabled={disabled}
            onClick={() =>
              updateStats('items', [
                ...value.stats.items,
                { icon: 'students', value: '', label: '' },
              ])
            }
          >
            <RiAddLine />
            Tambah Stat
          </IconButton>
        </div>
          </SectionCard>

          <SectionCard
            id="section-benefit-comparison"
            title="Benefit Comparison Section"
            description="Tabel perbandingan GuruMusik vs kompetitor."
          >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow">
            <input
              type="text"
              value={value.benefitsComparison.eyebrow}
              disabled={disabled}
              onChange={(event) =>
                updateBenefitsComparison('eyebrow', event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Section Title">
            <input
              type="text"
              value={value.benefitsComparison.title}
              disabled={disabled}
              onChange={(event) =>
                updateBenefitsComparison('title', event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Brand Label">
            <input
              type="text"
              value={value.benefitsComparison.brandLabel}
              disabled={disabled}
              onChange={(event) =>
                updateBenefitsComparison('brandLabel', event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Competitor Label">
            <input
              type="text"
              value={value.benefitsComparison.competitorLabel}
              disabled={disabled}
              onChange={(event) =>
                updateBenefitsComparison('competitorLabel', event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <ProgramPageImageUploadField
            label="Brand Logo"
            value={value.benefitsComparison.brandLogoSrc}
            disabled={disabled}
            previewAlt={
              value.benefitsComparison.brandLogoAlt ||
              value.benefitsComparison.brandLabel ||
              'Brand logo'
            }
            onChange={(next) => updateBenefitsComparison('brandLogoSrc', next)}
          />
          <Field label="Brand Logo Alt">
            <input
              type="text"
              value={value.benefitsComparison.brandLogoAlt}
              disabled={disabled}
              onChange={(event) =>
                updateBenefitsComparison('brandLogoAlt', event.target.value)
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-6 space-y-4">
          {value.benefitsComparison.rows.map((row, index) => (
            <div key={`comparison-${index}`} className="rounded-2xl border border-neutral-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-neutral-900">
                  Row #{index + 1}
                </div>
                <IconButton
                  variant="danger"
                  disabled={disabled || value.benefitsComparison.rows.length <= 1}
                  onClick={() =>
                    updateBenefitsComparison(
                      'rows',
                      value.benefitsComparison.rows.filter((_, rowIndex) => rowIndex !== index)
                    )
                  }
                >
                  <RiDeleteBin6Line />
                  Hapus
                </IconButton>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Feature">
                  <input
                    type="text"
                    value={row.feature}
                    disabled={disabled}
                    onChange={(event) =>
                      updateComparisonRow(index, { feature: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <div className="grid gap-4">
                  <Field label="Program Tone">
                    <select
                      value={row.program.tone}
                      disabled={disabled}
                      onChange={(event) =>
                        updateComparisonRow(index, {
                          program: {
                            ...row.program,
                            tone: event.target.value as ProgramPageBenefitTone,
                          },
                        })
                      }
                      className={selectClass}
                    >
                      {BENEFIT_TONE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Program Label">
                    <input
                      type="text"
                      value={row.program.label}
                      disabled={disabled}
                      onChange={(event) =>
                        updateComparisonRow(index, {
                          program: { ...row.program, label: event.target.value },
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid gap-4">
                  <Field label="Competitor Tone">
                    <select
                      value={row.competitor.tone}
                      disabled={disabled}
                      onChange={(event) =>
                        updateComparisonRow(index, {
                          competitor: {
                            ...row.competitor,
                            tone: event.target.value as ProgramPageBenefitTone,
                          },
                        })
                      }
                      className={selectClass}
                    >
                      {BENEFIT_TONE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Competitor Label">
                    <input
                      type="text"
                      value={row.competitor.label}
                      disabled={disabled}
                      onChange={(event) =>
                        updateComparisonRow(index, {
                          competitor: {
                            ...row.competitor,
                            label: event.target.value,
                          },
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <IconButton
            disabled={disabled}
            onClick={() =>
              updateBenefitsComparison('rows', [
                ...value.benefitsComparison.rows,
                {
                  feature: '',
                  program: { tone: 'yes', label: '' },
                  competitor: { tone: 'sometimes', label: '' },
                },
              ])
            }
          >
            <RiAddLine />
            Tambah Row
          </IconButton>
        </div>
          </SectionCard>

          <SectionCard
            id="section-pricing"
            title="Pricing Section"
            description="Section harga dan plan card."
          >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow">
            <input
              type="text"
              value={value.pricing.eyebrow}
              disabled={disabled}
              onChange={(event) => updatePricing('eyebrow', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Section Title">
            <input
              type="text"
              value={value.pricing.title}
              disabled={disabled}
              onChange={(event) => updatePricing('title', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-6 space-y-4">
          {value.pricing.plans.map((plan, index) => (
            <div key={`plan-${index}`} className="rounded-2xl border border-neutral-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-neutral-900">
                  Plan #{index + 1}
                </div>
                <IconButton
                  variant="danger"
                  disabled={disabled || value.pricing.plans.length <= 1}
                  onClick={() =>
                    updatePricing(
                      'plans',
                      value.pricing.plans.filter((_, planIndex) => planIndex !== index)
                    )
                  }
                >
                  <RiDeleteBin6Line />
                  Hapus
                </IconButton>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Badge">
                  <input
                    type="text"
                    value={plan.badge}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, { badge: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Discount Label">
                  <input
                    type="text"
                    value={plan.discountLabel}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, { discountLabel: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    rows={3}
                    value={plan.description}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, { description: event.target.value })
                    }
                    className={textAreaClass}
                  />
                </Field>
                <div className="grid gap-4">
                  <Field label="Original Price">
                    <input
                      type="text"
                      value={plan.originalPrice}
                      disabled={disabled}
                      onChange={(event) =>
                        updatePricingPlan(index, { originalPrice: event.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Starting Price">
                    <input
                      type="text"
                      value={plan.startingPrice}
                      disabled={disabled}
                      onChange={(event) =>
                        updatePricingPlan(index, { startingPrice: event.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Starting From Label">
                  <input
                    type="text"
                    value={plan.startingFromLabel}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, { startingFromLabel: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Billing Cycle">
                  <input
                    type="text"
                    value={plan.billingCycle}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, { billingCycle: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Registration Note">
                  <textarea
                    rows={3}
                    value={plan.registrationNote}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, { registrationNote: event.target.value })
                    }
                    className={textAreaClass}
                  />
                </Field>
                <Field label="Registration Tooltip">
                  <textarea
                    rows={3}
                    value={plan.registrationTooltip}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, {
                        registrationTooltip: event.target.value,
                      })
                    }
                    className={textAreaClass}
                  />
                </Field>
                <Field label="CTA Label">
                  <input
                    type="text"
                    value={plan.ctaLabel}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, { ctaLabel: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="CTA Href">
                  <input
                    type="text"
                    value={plan.ctaHref}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePricingPlan(index, { ctaHref: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <StringItemsInput
                  label="Benefits"
                  value={plan.benefits}
                  onChange={(benefits) => updatePricingPlan(index, { benefits })}
                  placeholder="Contoh: Guru datang langsung ke rumah."
                  addLabel="Tambah Benefit"
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <IconButton
            disabled={disabled}
            onClick={() =>
              updatePricing('plans', [
                ...value.pricing.plans,
                {
                  badge: '',
                  description: '',
                  discountLabel: '',
                  originalPrice: '',
                  startingFromLabel: '',
                  startingPrice: '',
                  billingCycle: '',
                  registrationNote: '',
                  registrationTooltip: '',
                  ctaLabel: '',
                  ctaHref: '',
                  benefits: [],
                },
              ])
            }
          >
            <RiAddLine />
            Tambah Plan
          </IconButton>
        </div>
          </SectionCard>

          <SectionCard
            id="section-explore-programs"
            title="Explore Programs Section"
            description="Section manual untuk menampilkan program lain dalam bentuk card carousel/grid."
          >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow">
            <input
              type="text"
              value={value.explorePrograms.eyebrow}
              disabled={disabled}
              onChange={(event) =>
                updateExplorePrograms('eyebrow', event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Section Title">
            <input
              type="text"
              value={value.explorePrograms.title}
              disabled={disabled}
              onChange={(event) =>
                updateExplorePrograms('title', event.target.value)
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-6 space-y-4">
          {value.explorePrograms.items.map((item, index) => (
            <div key={`explore-program-${index}`} className="rounded-2xl border border-neutral-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-neutral-900">
                  Card #{index + 1}
                </div>
                <IconButton
                  variant="danger"
                  disabled={disabled || value.explorePrograms.items.length <= 1}
                  onClick={() =>
                    updateExplorePrograms(
                      'items',
                      value.explorePrograms.items.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                >
                  <RiDeleteBin6Line />
                  Hapus
                </IconButton>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Badge">
                  <input
                    type="text"
                    value={item.badge}
                    disabled={disabled}
                    onChange={(event) =>
                      updateExploreProgramItem(index, { badge: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Card Title">
                  <input
                    type="text"
                    value={item.title}
                    disabled={disabled}
                    onChange={(event) =>
                      updateExploreProgramItem(index, { title: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="CTA Label">
                  <input
                    type="text"
                    value={item.ctaLabel}
                    disabled={disabled}
                    onChange={(event) =>
                      updateExploreProgramItem(index, { ctaLabel: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="CTA Href">
                  <input
                    type="text"
                    value={item.ctaHref}
                    disabled={disabled}
                    onChange={(event) =>
                      updateExploreProgramItem(index, { ctaHref: event.target.value })
                    }
                    className={inputClass}
                    placeholder="/program/special-need"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      value={item.description}
                      disabled={disabled}
                      onChange={(event) =>
                        updateExploreProgramItem(index, { description: event.target.value })
                      }
                      className={textAreaClass}
                      rows={3}
                    />
                  </Field>
                </div>
                <ProgramPageImageUploadField
                  label="Card Image"
                  value={item.imageSrc}
                  disabled={disabled}
                  previewAlt={item.imageAlt || item.title || 'Explore program image'}
                  onChange={(next) => updateExploreProgramItem(index, { imageSrc: next })}
                />
                <Field label="Image Alt">
                  <input
                    type="text"
                    value={item.imageAlt}
                    disabled={disabled}
                    onChange={(event) =>
                      updateExploreProgramItem(index, { imageAlt: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <StringItemsInput
                  label="Benefits"
                  value={item.benefits}
                  onChange={(benefits) =>
                    updateExploreProgramItem(index, { benefits })
                  }
                  placeholder="Contoh: Guru berpengalaman khusus ABK."
                  addLabel="Tambah Benefit"
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <IconButton
            disabled={disabled}
            onClick={() =>
              updateExplorePrograms('items', [
                ...value.explorePrograms.items,
                {
                  badge: '',
                  title: '',
                  description: '',
                  imageSrc: '',
                  imageAlt: '',
                  ctaLabel: '',
                  ctaHref: '',
                  benefits: [],
                },
              ])
            }
          >
            <RiAddLine />
            Tambah Card
          </IconButton>
        </div>
          </SectionCard>
        </>
      ) : null}

      {isStyleMode ? (
        <SectionCard
          id="section-theme-visual-tokens"
          title="Theme & Visual Tokens"
          description="Atur warna, gradient, border, dan shadow per section. Field warna bisa memilih token global; gradient/shadow tetap bisa diisi manual."
        >
          <div className="space-y-5">
            {THEME_FIELD_GROUPS.map((group) => (
              <details
                key={group.title}
                id={group.id}
                open
                className="scroll-mt-28 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-neutral-900">
                  {group.title}
                  <span className="mt-1 block text-sm font-normal text-neutral-600">
                    {group.description}
                  </span>
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.fields.map((field) => (
                    <ThemeFieldInput
                      key={field.key}
                      label={field.label}
                      helperText={field.helperText}
                      mode={field.mode}
                      value={value.theme[field.key]}
                      disabled={disabled}
                      onChange={(next) => updateTheme(field.key, next)}
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
