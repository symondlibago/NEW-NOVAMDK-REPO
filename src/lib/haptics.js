/** A short buzz, on phones that can (Android; iPhones ignore it). */
export function buzz(ms = 30) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not offered here */
  }
}
