// GameIcon — Icons8 3D Fluency style (PNG assets from assets/icons/)
import { Image, type ImageStyle } from "react-native";

const ICONS = {
  book:         require("../../assets/icons/book.png"),
  calendar:     require("../../assets/icons/calendar.png"),
  check:        require("../../assets/icons/check.png"),
  chest:        require("../../assets/icons/chest.png"),
  clock:        require("../../assets/icons/clock.png"),
  coin:         require("../../assets/icons/coin.png"),
  cross:        require("../../assets/icons/cross.png"),
  crown:        require("../../assets/icons/crown.png"),
  fire:         require("../../assets/icons/fire.png"),
  gem:          require("../../assets/icons/gem.png"),
  gift:         require("../../assets/icons/gift.png"),
  graduation:   require("../../assets/icons/graduation.png"),
  headphones:   require("../../assets/icons/headphones.png"),
  heart:        require("../../assets/icons/heart.png"),
  lightning:    require("../../assets/icons/lightning.png"),
  lock:         require("../../assets/icons/lock.png"),
  microphone:   require("../../assets/icons/microphone.png"),
  notification: require("../../assets/icons/notification.png"),
  pencil:       require("../../assets/icons/pencil.png"),
  rocket:       require("../../assets/icons/rocket.png"),
  star:         require("../../assets/icons/star.png"),
  target:       require("../../assets/icons/target.png"),
  trophy:       require("../../assets/icons/trophy.png"),
  users:        require("../../assets/icons/users.png"),
} as const;

export type GameIconName = keyof typeof ICONS;

interface GameIconProps {
  name: GameIconName;
  size?: number;
  style?: ImageStyle;
}

export function GameIcon({ name, size = 32, style }: GameIconProps) {
  const source = ICONS[name];
  if (!source) return null;
  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
