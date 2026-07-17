import { useEffect } from 'react';
import { getLang } from './i18n';

const SITE_URL = 'https://keyatlas.pages.dev';

function upsertMeta(selector: string, createAttrs: Record<string, string>, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    for (const [key, value] of Object.entries(createAttrs)) el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = url;
}

export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    document.title = title;
    document.documentElement.lang = getLang() === 'zh' ? 'zh-CN' : 'en';
    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary');
    upsertCanonical(url);
  }, [title, description, path]);
}

export function useJsonLd(data: Record<string, unknown>) {
  useEffect(() => {
    const id = 'keyatlas-jsonld';
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }, [data]);
}
