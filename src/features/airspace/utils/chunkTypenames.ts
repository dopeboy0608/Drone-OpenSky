// VWorld WMS는 LAYERS를 요청당 최대 4개까지만 받는다(초과 시 INVALID_RANGE). 입력 순서를 유지해 나눈다.
export const chunkTypenames = (typenames: string[], size: number): string[][] => {
  if (size < 1) {
    throw new Error('chunk size must be at least 1');
  }

  const chunks: string[][] = [];
  for (let start = 0; start < typenames.length; start += size) {
    chunks.push(typenames.slice(start, start + size));
  }
  return chunks;
};
