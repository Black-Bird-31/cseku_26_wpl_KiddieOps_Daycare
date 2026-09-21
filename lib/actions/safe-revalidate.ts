import { revalidatePath } from "next/cache";

/**
 * Safely calls revalidatePath without crashing outside Next.js request contexts (e.g., test runner)
 */
export function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // No-op outside Next.js request context
  }
}
