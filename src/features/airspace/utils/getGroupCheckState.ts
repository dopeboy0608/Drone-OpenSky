export type GroupCheckState = 'all' | 'some' | 'none';

// visibility에 없는 키는 꺼짐으로 본다. 스토어가 알 수 없는 키를 만들지 않으므로 사실상 방어용이지만,
// 상수와 스토어 초기값이 어긋나도 체크박스가 '전체 켜짐'으로 잘못 표시되지 않게 하기 위함이다.
export const getGroupCheckState = (
  typenames: readonly string[],
  visibility: Record<string, boolean>,
): GroupCheckState => {
  const visibleCount = typenames.filter((typename) => visibility[typename]).length;

  if (visibleCount === 0) {
    return 'none';
  }
  return visibleCount === typenames.length ? 'all' : 'some';
};
