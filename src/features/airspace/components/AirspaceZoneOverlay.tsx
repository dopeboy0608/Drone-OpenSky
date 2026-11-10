import { CloseOutlined } from '@ant-design/icons';
import { Button, Card, ConfigProvider, theme } from 'antd';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';

interface AirspaceZoneOverlayProps {
  position: { lat: number; lng: number };
  zoneType: string;
  onClose: () => void;
}

// 닫기 버튼 호버 배경. antd token에 이보다 진한 단계가 없어 상수로 둔다.
const HOVER_FILL = 'rgba(0, 0, 0, 0.25)';

export const AirspaceZoneOverlay = ({ position, zoneType, onClose }: AirspaceZoneOverlayProps) => {
  const { token } = theme.useToken();

  return (
    // 앵커를 0,0으로 두고 위치 보정은 아래 래퍼의 CSS translate로 한다. 카카오의 xAnchor/yAnchor는 오버레이를
    // 붙이는 시점에 잰 크기로 오프셋을 계산하는데, 내용이 나중에 레이아웃되면(예: WMS 모드처럼 조회 응답 뒤에
    // 비동기로 열릴 때) 너비가 달라져 꼬리가 클릭 지점에서 한쪽으로 밀렸다. CSS translate의 퍼센트는 렌더된
    // 자기 크기를 기준으로 하므로 타이밍과 무관하게 꼬리 끝이 클릭 좌표에 맞는다. 꼬리 없이 위로 띄우면
    // 어디를 눌렀는지 알 수 없었다.
    <CustomOverlayMap position={position} xAnchor={0} yAnchor={0} zIndex={10}>
      {/* Card의 box-shadow는 꼬리를 따라가지 못해 이음새에서 끊기므로, 카드와 꼬리를 한 덩어리로 감싼 래퍼에 drop-shadow를 준다(지도 색과 구분). */}
      <div className="flex -translate-x-1/2 -translate-y-full flex-col items-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
        <Card
          size="small"
          title={zoneType}
          extra={
            // filled 기본 배경(colorFillTertiary, 약 4%)이 지도 위에서 거의 안 보여 한 단계씩 진하게 올린다.
            // 버튼에만 적용되도록 이 서브트리 토큰만 바꾼다.
            <ConfigProvider
              theme={{
                token: { colorFillTertiary: token.colorFill, colorFillSecondary: HOVER_FILL },
              }}
            >
              <Button
                // text 타입은 평소엔 X 아이콘만 보이다가 호버 때만 배경이 채워져 크기·간격이 달라 보인다.
                // filled 원형은 평소에도 같은 크기의 배경이 보여 호버 전후 모양이 일정하다.
                variant="filled"
                color="default"
                shape="circle"
                size="small"
                icon={<CloseOutlined />}
                onClick={onClose}
                aria-label="닫기"
              />
            </ConfigProvider>
          }
          className="whitespace-nowrap"
          styles={{
            header: { borderBottom: 'none' },
            // antd 헤더 래퍼는 이미 flex이고 제목이 flex:1이라 닫기 버튼이 우측 끝에 붙는다(space-between과 같은 배치).
            // 카드가 내용 폭에 맞춰 줄어들 때 제목과 버튼이 붙지 않도록, 간격을 카드 small 헤더 좌우 패딩(paddingSM=12)과 같게 둔다.
            title: { paddingInlineEnd: token.paddingSM },
            body: { display: 'none' },
          }}
        />
        {/* 테두리 삼각형으로 그려 끝점이 래퍼 바닥(클릭 좌표)에 정확히 놓이게 한다. 회전한 정사각형은 꼭짓점이 어긋난다.
          바깥(카드 테두리색)·안쪽(흰색) 삼각형을 겹쳐 꼬리에도 1px 테두리를 만들고, -mt-px로 카드 아랫변을 안쪽 삼각형이 덮어 이음새 선을 없앤다. */}
        <div className="relative -mt-px h-0 w-0 border-x-[8px] border-t-[9px] border-x-transparent border-t-[#f0f0f0]">
          <div className="absolute -top-[9px] -left-[7px] h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-white" />
        </div>
      </div>
    </CustomOverlayMap>
  );
};
