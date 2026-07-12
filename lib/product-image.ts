const replacements = new Map([
  [
    "https://images.unsplash.com/photo-1506629905607-d9a297d14d30",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85",
  ],
]);

export function productImageUrl(url: string) {
  for (const [source, replacement] of replacements) {
    if (url.startsWith(source)) return replacement;
  }

  return url;
}
