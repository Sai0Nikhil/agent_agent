const globalStore = globalThis as unknown as {
  __diyapulsePreviews?: Map<string, { html: string; createdAt: number }>;
};

const previews =
  globalStore.__diyapulsePreviews ||
  (globalStore.__diyapulsePreviews = new Map<string, { html: string; createdAt: number }>());

export function saveDashboardPreview(id: string, html: string): void {
  // Keep memory bounded to latest 30 generated apps
  if (previews.size >= 30) {
    const oldestKey = previews.keys().next().value;
    if (oldestKey) previews.delete(oldestKey);
  }
  previews.set(id, { html, createdAt: Date.now() });
}

export function getDashboardPreview(id: string): string | null {
  return previews.get(id)?.html ?? null;
}
