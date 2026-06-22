// Default site content — bundled at build time so SSR and the first paint
// always have data. At runtime the client fetches `/content.json` from the
// public folder; edit that file (in `public/content.json`) to update
// projects, copy, and section content without changing any code.
//
// Shape kept in sync with `public/content.json`.
import defaultContent from "../../public/content.json";

export type SiteData = {
  brand: {
    name: string;
    monogram: string;
    location: string;
    nav: { label: string; href: string }[];
  };
  hero: {
    eyebrow: string;
    name: string;
    tagline: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    media: string;
  };
  selectedWork: {
    eyebrow: string;
    title: string;
    viewAll: { label: string; href: string };
    projects: {
      id: string;
      category: string;
      title: string;
      description: string;
      image: string;
      href: string;
      repo?: string;
    }[];
  };
  creativeWork: {
    eyebrow: string;
    title: string;
    projects: {
      id: string;
      category: string;
      title: string;
      description: string;
      image: string;
      href: string;
    }[];
  };
  upesWork: {
    eyebrow: string;
    title: string;
    projects: {
      id: string;
      category: string;
      title: string;
      description: string;
      image: string;
      href: string;
    }[];
  };
  workedWith: {
    eyebrow: string;
    title: string;
    brands: {
      name: string;
      description: string;
      logo: string;
      href?: string;
    }[];
  };
  clients: { eyebrow: string; title: string; logos: string[] };
  certifications: {
    eyebrow: string;
    title: string;
    projects: {
      id: string;
      title: string;
      category: string;
      description: string;
      file: string;
      href: string;
    }[];
  };
  creativeTools: { eyebrow: string; title: string; logos: string[] };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    cta: { label: string; href: string };
    portrait: string;
  };
  testimonial: {
    eyebrow: string;
    title: string;
    quote: string;
    author: string;
  };
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    email: string;
    socials: { label: string; href: string }[];
  };
  devCta: {
    eyebrow: string;
    title: string;
    description: string;
    email: string;
    socials: { label: string; href: string }[];
  };
};

export const siteData = defaultContent as SiteData;
