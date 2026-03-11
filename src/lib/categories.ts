import { Scissors, Wrench, Wind, Zap, Sparkles, Home, Settings } from "lucide-react";

export const SERVICE_CATEGORIES = [
  { id: "haircut", label: "Haircut / Barber", icon: Scissors, emoji: "💈", avgPrice: 45 },
  { id: "plumbing", label: "Plumbing", icon: Wrench, emoji: "🔧", avgPrice: 120 },
  { id: "ac_cleaning", label: "AC Cleaning", icon: Wind, emoji: "❄️", avgPrice: 80 },
  { id: "electrician", label: "Electrician", icon: Zap, emoji: "⚡", avgPrice: 100 },
  { id: "home_cleaning", label: "Home Cleaning", icon: Home, emoji: "🏠", avgPrice: 90 },
  { id: "beauty", label: "Beauty Services", icon: Sparkles, emoji: "✨", avgPrice: 60 },
  { id: "appliance_repair", label: "Appliance Repair", icon: Settings, emoji: "🛠️", avgPrice: 110 },
] as const;

export type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]["id"];

export function getCategoryById(id: string) {
  return SERVICE_CATEGORIES.find((c) => c.id === id) || SERVICE_CATEGORIES[0];
}

export function getCategoryEmoji(id: string) {
  return getCategoryById(id).emoji;
}
