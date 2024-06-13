import { icons } from 'lucide-react';

function DynamicIcon(props: { 
  name: string; 
  color?: string; 
  size?: number;
}) {
  const { name, color, size }=props;
  // @ts-ignore
  const LucideIcon = icons[name];
  return <LucideIcon color={color} size={size} />;
}

export default DynamicIcon;