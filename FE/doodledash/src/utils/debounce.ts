export function debounce<T extends (...args: any[]) => void>(
  callBack: T,
  delayInMs: number,
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callBack(args);
    }, delayInMs);
  };
}
