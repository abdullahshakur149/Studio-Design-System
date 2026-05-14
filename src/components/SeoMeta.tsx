import { Helmet } from 'react-helmet-async';
import { env } from '@/lib/env';

interface SeoMetaProps {
  title: string;
  description?: string;
  noIndex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalPath?: string;
}

const SITE_URL = env.VITE_SITE_URL;
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo-wordmark.svg`;

export function SeoMeta({
  title,
  description,
  noIndex,
  ogImage,
  ogType = 'website',
  canonicalPath,
}: SeoMetaProps): JSX.Element {
  const canonical = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;
  const image = ogImage ?? DEFAULT_OG_IMAGE;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <meta name="robots" content="index, follow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={image} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content="Studio" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
