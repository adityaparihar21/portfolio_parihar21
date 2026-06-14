import { useEffect, useState } from "react";
import { siteData, type SiteData } from "./site-data";

/**
 * Loads site content from `/content.json` at runtime so editors can update
 * `public/content.json` and have changes picked up on the next page load
 * without requiring a code change. Falls back to the bundled default for
 * SSR and the very first paint.
 */
export function useContent(): SiteData {
  const [data, setData] = useState<SiteData>(siteData);

  useEffect(() => {
    let cancelled = false;
    fetch("/content.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json) setData(json as SiteData);
      })
      .catch(() => {
        /* keep bundled default */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
