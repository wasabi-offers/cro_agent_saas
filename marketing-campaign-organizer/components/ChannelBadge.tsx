import React from 'react';
import { Mail, Share2, Megaphone, MessageSquare, Workflow } from 'lucide-react';

type Channel = 'email' | 'social' | 'ads' | 'sms' | 'other';

interface ChannelBadgeProps {
  channel: Channel;
}

const channelConfig: Record<Channel, { label: string; icon: any; color: string }> = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-400' },
  social: { label: 'Social', icon: Share2, color: 'text-pink-400' },
  ads: { label: 'Ads', icon: Megaphone, color: 'text-green-400' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'text-purple-400' },
  other: { label: 'Altro', icon: Workflow, color: 'text-gray-400' },
};

export default function ChannelBadge({ channel }: ChannelBadgeProps) {
  const config = channelConfig[channel];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 ${config.color}`}>
      <Icon size={16} />
      <span className="text-sm font-medium">{config.label}</span>
    </span>
  );
}
