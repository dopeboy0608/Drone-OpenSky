const pad = (value: number) => String(value).padStart(2, '0');

// "최신 상태입니다" 안내에 붙이는 시각이다. 같은 날이면 날짜가 군더더기라 시:분만 쓰고,
// 날짜가 다르면 하루 이상 지난 캐시인지 구별할 수 있도록 월·일을 더한다.
export const formatLastUpdated = (updatedAt: number, now: number = Date.now()): string => {
  const updated = new Date(updatedAt);
  const current = new Date(now);
  const time = `${pad(updated.getHours())}:${pad(updated.getMinutes())}`;

  const isSameDay =
    updated.getFullYear() === current.getFullYear() &&
    updated.getMonth() === current.getMonth() &&
    updated.getDate() === current.getDate();

  return isSameDay ? time : `${updated.getMonth() + 1}월 ${updated.getDate()}일 ${time}`;
};
