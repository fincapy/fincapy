import React from 'react';
import {
  Home,
  ShoppingCart,
  Car,
  Heart,
  GraduationCap,
  Gift,
  Film,
  Utensils,
  Plane,
  Briefcase,
  BookOpen,
  Landmark,
  PiggyBank,
  Receipt,
  PawPrint,
  Smile,
  Laptop,
  Music,
  Bus,
  Baby,
  Dumbbell,
  Shirt,
  Heartbeat,
  HomeIcon,
  ShoppingBag,
  CarIcon,
  Popcorn,
  PartyPopper,
  Beer,
  Coffee,
  Pizza,
  PlaneIcon,
  Hotel,
  GasStation,
  Train,
  Wrench,
  Brush,
  GiftIcon,
  Book,
  HandCoins,
  Shield,
  Phone,
  Gamepad2,
  Tv,
  Leaf,
  Droplets,
  Bone,
  Apple,
  Beef,
  Award,
  CircleDollarSign,
  Coins,
  CreditCard,
  Wallet,
  LandmarkIcon,
  Percent,
  TrendingUp,
  TrendingDown,
  User,
  Users,
  Sprout,
  BriefcaseBusiness,
  MessageSquare,
  BadgeHelp,
  FileText,
} from 'lucide-react';

export const iconOptions = {
  home: Home,
  shoppingCart: ShoppingCart,
  car: Car,
  heart: Heart,
  graduationCap: GraduationCap,
  gift: Gift,
  film: Film,
  utensils: Utensils,
  plane: Plane,
  briefcase: Briefcase,
  bookOpen: BookOpen,
  landmark: Landmark,
  piggyBank: PiggyBank,
  receipt: Receipt,
  pawPrint: PawPrint,
  smile: Smile,
  laptop: Laptop,
  music: Music,
  bus: Bus,
  baby: Baby,
  dumbbell: Dumbbell,
  shirt: Shirt,
  homeIcon: HomeIcon,
  shoppingBag: ShoppingBag,
  carIcon: CarIcon,
  popcorn: Popcorn,
  partyPopper: PartyPopper,
  beer: Beer,
  coffee: Coffee,
  pizza: Pizza,
  planeIcon: PlaneIcon,
  hotel: Hotel,
  train: Train,
  wrench: Wrench,
  brush: Brush,
  giftIcon: GiftIcon,
  book: Book,
  handCoins: HandCoins,
  shield: Shield,
  phone: Phone,
  gamepad2: Gamepad2,
  tv: Tv,
  leaf: Leaf,
  droplets: Droplets,
  bone: Bone,
  apple: Apple,
  beef: Beef,
  award: Award,
  circleDollarSign: CircleDollarSign,
  coins: Coins,
  creditCard: CreditCard,
  wallet: Wallet,
  landmarkIcon: LandmarkIcon,
  percent: Percent,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  user: User,
  users: Users,
  sprout: Sprout,
  briefcaseBusiness: BriefcaseBusiness,
  messageSquare: MessageSquare,
  badgeHelp: BadgeHelp,
  fileText: FileText,
};

export const IconSelector = ({ value, onChange }) => {
  return (
    <div className="max-h-40 overflow-y-auto p-1">
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
        {Object.entries(iconOptions).map(([name, Icon]) => (
          <button
            key={name}
            type="button"
            className={`p-2 rounded-md flex items-center justify-center transition-all duration-200 ${
              value === name
                ? 'bg-primary text-primary-foreground'
                : 'bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            onClick={() => onChange(name)}
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
};

export function getRandomIcon() {
  const iconNames = Object.keys(iconOptions);
  const randomIndex = Math.floor(Math.random() * iconNames.length);
  return iconNames[randomIndex];
}
