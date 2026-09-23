interface MapControlsProps {
  onRefetchPolygons: () => void;
  onRefetchLocation: () => void;
  onMoveToLocation: () => void;
  canMoveToLocation: boolean;
}

const BUTTON_CLASS =
  'rounded-md bg-white/90 px-3 py-2 text-xs text-gray-800 shadow disabled:cursor-not-allowed disabled:opacity-50';

export const MapControls = ({
  onRefetchPolygons,
  onRefetchLocation,
  onMoveToLocation,
  canMoveToLocation,
}: MapControlsProps) => (
  <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
    <button type="button" onClick={onRefetchPolygons} className={BUTTON_CLASS}>
      공역 재조회
    </button>
    <button type="button" onClick={onRefetchLocation} className={BUTTON_CLASS}>
      현재위치 재조회
    </button>
    {/* 아직 위치를 확보하지 못한 경우(canMoveToLocation=false) 비활성화 */}
    <button
      type="button"
      onClick={onMoveToLocation}
      disabled={!canMoveToLocation}
      className={BUTTON_CLASS}
    >
      현재위치로 이동
    </button>
  </div>
);
