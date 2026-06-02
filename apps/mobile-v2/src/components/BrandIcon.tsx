import Svg, { Circle, Path, Rect } from "react-native-svg";

import { GameIcon } from "@/components/GameIcon";

export type BrandIconName = "coin" | "streak" | "home" | "practice" | "exam" | "course" | "profile";

interface BrandIconProps {
  name: BrandIconName;
  size?: number;
  active?: boolean;
}

export function BrandIcon({ name, size = 24, active = true }: BrandIconProps) {
  const opacity = active ? 1 : 0.52;

  switch (name) {
    case "coin":
      return (
        <Svg width={size} height={size} viewBox="0 0 430 430" fill="none" opacity={opacity}>
          <Path fill="#ffc738" d="M375.12 215a160.222 160.222 0 0 1-273.513 113.393A160.23 160.23 0 0 1 66.895 153.74 160.22 160.22 0 0 1 215 54.88 159.34 159.34 0 0 1 375.12 215" />
          <Path fill="#ffc738" opacity={0.5} d="M375.12 215a160.222 160.222 0 0 1-273.513 113.393A160.23 160.23 0 0 1 66.895 153.74 160.22 160.22 0 0 1 215 54.88 159.34 159.34 0 0 1 375.12 215" />
          <Path fill="#ffc738" d="M353.45 295.48a160.76 160.76 0 0 1-75.51 66.8l-28.49-32.22L105 166.72l-28.47-32.2a160.76 160.76 0 0 1 75.51-66.8l28.49 32.22L325 263.28z" />
          <Path stroke="#b26836" strokeLinecap="round" strokeLinejoin="round" strokeWidth={7} d="M299.912 299.916c46.898-46.898 46.898-122.934 0-169.832s-122.935-46.898-169.833 0-46.898 122.934 0 169.832c46.898 46.899 122.935 46.899 169.833 0" />
        </Svg>
      );
    case "streak":
      return (
        <Svg width={size} height={size} viewBox="0 0 19 24" fill="none" opacity={opacity}>
          <Path d="M0 15.0451V5.54508C0 3.5451 1.5 3.54507 2.5 4.04507L4.5 5.04507C5.33333 3.87841 7.2 1.34508 8 0.545085C9 -0.454915 10 0.045085 11 1.04508C12 2.04508 15 6.04508 16.5 8.04508C18 10.0451 18.5 12.0451 18.5 15.0451C18.5 18.0451 15 23.0451 9 23.0451C3 23.0451 0 17.5451 0 15.0451Z" fill="#FF9600" />
          <Path d="M5.99996 13.5451C6.79996 12.3451 7.99996 10.7118 8.49996 10.0451C8.66664 9.71175 9.2 9.24508 10 10.0451C11 11.0451 12 13.0451 12.5 13.5451C13 14.0451 13.5 16.0451 12.5 17.5451C11.5 19.0451 10 19.5451 9 19.5451C8 19.5451 6.49996 18.5451 5.99996 17.5451C5.49996 16.5451 4.99996 15.0451 5.99996 13.5451Z" fill="#FFC800" />
        </Svg>
      );
    case "home":
      return (
        <Svg width={size} height={size} viewBox="0 0 34 29" fill="none" opacity={opacity}>
          <Path d="M7.62524 28.5L4.50024 10.82L17.0002 2.5L29.5002 10.82L25.8544 28.5H7.62524Z" fill="#FFC800" />
          <Path d="M15.0002 22H19.5002" stroke="#CD7900" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2.50024 12.5L17.0002 2.5L31.5002 12.5" stroke="#FF4B4B" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={17.0002} cy={15} r={4} fill="#AA572A" />
        </Svg>
      );
    case "practice":
      return (
        <Svg width={size} height={size} viewBox="0 0 37 31" fill="none" opacity={opacity}>
          <Path d="M12.5005 18.5007L24.0005 11.5007" stroke="#C9C7C7" strokeWidth={3} strokeLinecap="round" />
          <Path fillRule="evenodd" clipRule="evenodd" d="M18.5161 0.527712C20.4342 -0.568328 22.8776 0.0980589 23.9736 2.01613L31.9736 16.0161C33.0697 17.9342 32.4033 20.3776 30.4852 21.4737C28.5671 22.5697 26.1237 21.9033 25.0277 19.9852L17.0277 5.98524C15.9316 4.06717 16.598 1.62375 18.5161 0.527712ZM5.47777 8.54989C7.38358 7.43269 9.83423 8.07199 10.9514 9.97781L19.4514 24.4778C20.5686 26.3836 19.9293 28.8343 18.0235 29.9515C16.1177 31.0687 13.6671 30.4294 12.5499 28.5236L4.04985 14.0236C2.93265 12.1177 3.57195 9.6671 5.47777 8.54989Z" fill="#1CB0F6" />
          <Path fillRule="evenodd" clipRule="evenodd" d="M26.7846 1.95023C28.4694 1.00256 30.6034 1.60008 31.5511 3.28483L36.0511 11.2848C36.9987 12.9696 36.4012 15.1036 34.7165 16.0513C33.0317 16.9989 30.8977 16.4014 29.95 14.7167L25.45 6.71666C24.5024 5.0319 25.0999 2.8979 26.7846 1.95023ZM1.72599 14.984C3.3921 14.0039 5.53726 14.5601 6.51733 16.2262L11.5173 24.7262C12.4974 26.3923 11.9412 28.5374 10.2751 29.5175C8.60901 30.4976 6.46386 29.9414 5.48379 28.2753L0.483788 19.7753C-0.49628 18.1092 0.0598712 15.964 1.72599 14.984Z" fill="#1CB0F6" />
          <Path d="M3.00049 17.5007L4.25049 19.5007M28.0005 4.00073L29.2505 6.00073M21.0005 4.00073L22.2505 6.00073M7.00049 12.0007L8.25049 14.0007" stroke="#63C9F9" strokeWidth={3} strokeLinecap="round" />
        </Svg>
      );
    case "profile":
      return (
        <Svg width={size} height={size} viewBox="0 0 33 28" fill="none" opacity={opacity}>
          <Rect y={13} width={33} height={14} rx={7} fill="#9069CD" />
          <Rect x={3} width={26} height={27} rx={13} fill="#9069CD" />
          <Rect x={7} y={3} width={18} height={25} rx={9} fill="#F3AD6D" />
          <Circle cx={25.5} cy={15.5} r={3.5} fill="#F3AD6D" />
          <Path d="M7.5 19.0001C9.433 19.0001 11 17.4331 11 15.5001C11 14.9633 10.8792 14.4547 10.6632 14.0001L5.5 12.6274C4.59326 13.2599 4 14.3107 4 15.5001C4 17.4331 5.567 19.0001 7.5 19.0001Z" fill="#F3AD6D" />
          <Rect x={12} y={11} width={3} height={5} rx={1.5} fill="#D4924B" />
          <Rect x={17} y={11} width={3} height={5} rx={1.5} fill="#D4924B" />
          <Path d="M10 13C15.7701 13 20.589 8.92748 21.7392 3.5L14 1L6.5 6.5L5 11.9119C6.52211 12.6105 8.21557 13 10 13Z" fill="#9069CD" />
          <Path d="M12 18C11.4477 18 10.9907 18.4513 11.0899 18.9946C11.1473 19.3084 11.2317 19.6161 11.3425 19.9134C11.5687 20.52 11.9002 21.0712 12.318 21.5355C12.7359 21.9998 13.232 22.3681 13.7779 22.6194C14.3239 22.8707 14.9091 23 15.5 23C16.0909 23 16.6761 22.8707 17.2221 22.6194C17.768 22.3681 18.2641 21.9998 18.682 21.5355C19.0998 21.0712 19.4313 20.52 19.6575 19.9134C19.7683 19.6161 19.8527 19.3084 19.9101 18.9946C20.0093 18.4513 19.5523 18 19 18L15.5 18H12Z" fill="#FFFFFF" />
        </Svg>
      );
    case "exam":
      return <GameIcon name="mock-exam" size={size} style={{ opacity }} />;
    case "course":
      return <GameIcon name="course" size={size} style={{ opacity }} />;
  }
}
