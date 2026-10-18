import { useEffect } from 'react';
import { store } from './data';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${store.name}` : `${store.name} — Clothes from handwoven cotton and natural indigo`;
  }, [title]);
}
