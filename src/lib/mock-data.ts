// Mock data for CRO Agent - simulating data from Clarity, Crazy Egg, and Google Analytics

export interface Session {
  id: string;
  date: string;
  source: string;
  medium: string;
  device: string;
  country: string;
  city: string;
  pageViews: number;
  duration: number; // seconds
  bounced: boolean;
  converted: boolean;
  conversionValue: number;
}

export interface PageMetrics {
  page: string;
  pageViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number; // seconds
  bounceRate: number; // percentage
  exitRate: number; // percentage
  scrollDepth: number; // percentage
  clicks: number;
  rageClicks: number;
  deadClicks: number;
}

export interface HeatmapData {
  page: string;
  type: 'click' | 'scroll' | 'move';
  data: { x: number; y: number; value: number }[];
  totalSessions: number;
  lastUpdated: string;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: {
    name: string;
    visitors: number;
    dropoff: number; // percentage
  }[];
  conversionRate: number;
}

export interface ABTestSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  page: string;
  element: string;
  hypothesis: string;
  expectedImpact: string;
  metrics: string[];
  reasoning: string;
  status: 'pending' | 'running' | 'completed' | 'dismissed';
  createdAt: string;
  dataSource: 'clarity' | 'crazy_egg' | 'google_analytics' | 'combined';
}

export interface DataSource {
  id: string;
  name: string;
  type: 'clarity' | 'crazy_egg' | 'google_analytics';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string | null;
  metrics: {
    sessions?: number;
    recordings?: number;
    heatmaps?: number;
    events?: number;
  };
}

// Generate dates for the last 30 days
const generateDateRange = (days: number) => {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Generate random sessions
export const generateMockSessions = (): Session[] => {
  const sources = ['google', 'facebook', 'instagram', 'email', 'direct', 'referral', 'tiktok'];
  const mediums = ['organic', 'cpc', 'email', 'social', 'referral', 'none'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const countries = ['Italy', 'United States', 'United Kingdom', 'Germany', 'France', 'Spain'];
  const cities = ['Milan', 'Rome', 'New York', 'London', 'Berlin', 'Paris', 'Madrid'];
  const dates = generateDateRange(30);

  const sessions: Session[] = [];
  
  for (let i = 0; i < 2500; i++) {
    const bounced = Math.random() < 0.35;
    const converted = !bounced && Math.random() < 0.08;
    
    sessions.push({
      id: `session_${i}`,
      date: dates[Math.floor(Math.random() * dates.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      medium: mediums[Math.floor(Math.random() * mediums.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      pageViews: bounced ? 1 : Math.floor(Math.random() * 8) + 1,
      duration: bounced ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 600) + 30,
      bounced,
      converted,
      conversionValue: converted ? Math.floor(Math.random() * 200) + 20 : 0,
    });
  }
  
  return sessions;
};

// Generate page metrics
export const generateMockPageMetrics = (): PageMetrics[] => {
  const pages = [
    '/',
    '/products',
    '/products/[id]',
    '/cart',
    '/checkout',
    '/about',
    '/contact',
    '/blog',
    '/blog/[slug]',
    '/pricing',
  ];

  return pages.map((page) => ({
    page,
    pageViews: Math.floor(Math.random() * 5000) + 500,
    uniqueVisitors: Math.floor(Math.random() * 3000) + 300,
    avgTimeOnPage: Math.floor(Math.random() * 180) + 20,
    bounceRate: Math.random() * 60 + 15,
    exitRate: Math.random() * 50 + 10,
    scrollDepth: Math.random() * 40 + 40,
    clicks: Math.floor(Math.random() * 2000) + 100,
    rageClicks: Math.floor(Math.random() * 50),
    deadClicks: Math.floor(Math.random() * 100),
  }));
};

// Generate conversion funnels
export const generateMockFunnels = (): ConversionFunnel[] => {
  return [
    {
      id: 'checkout_funnel',
      name: 'E-commerce Checkout',
      steps: [
        { name: 'Product Page', visitors: 5420, dropoff: 0 },
        { name: 'Add to Cart', visitors: 2168, dropoff: 60 },
        { name: 'Cart Page', visitors: 1734, dropoff: 20 },
        { name: 'Checkout', visitors: 1041, dropoff: 40 },
        { name: 'Purchase', visitors: 416, dropoff: 60 },
      ],
      conversionRate: 7.7,
    },
    {
      id: 'lead_gen_funnel',
      name: 'Lead Generation',
      steps: [
        { name: 'Landing Page', visitors: 8200, dropoff: 0 },
        { name: 'Form View', visitors: 3280, dropoff: 60 },
        { name: 'Form Start', visitors: 1640, dropoff: 50 },
        { name: 'Form Submit', visitors: 820, dropoff: 50 },
      ],
      conversionRate: 10,
    },
    {
      id: 'blog_to_newsletter',
      name: 'Blog to Newsletter',
      steps: [
        { name: 'Blog Post', visitors: 12500, dropoff: 0 },
        { name: 'Newsletter CTA View', visitors: 6250, dropoff: 50 },
        { name: 'Subscribe Click', visitors: 1875, dropoff: 70 },
        { name: 'Email Confirmed', visitors: 937, dropoff: 50 },
      ],
      conversionRate: 7.5,
    },
    {
      id: 'saas_signup',
      name: 'SaaS Free Trial Signup',
      steps: [
        { name: 'Pricing Page', visitors: 9800, dropoff: 0 },
        { name: 'Start Trial Click', visitors: 6370, dropoff: 35 },
        { name: 'Account Details', visitors: 5096, dropoff: 20 },
        { name: 'Email Verification', visitors: 3567, dropoff: 30 },
        { name: 'Onboarding Complete', visitors: 2497, dropoff: 30 },
      ],
      conversionRate: 25.5,
    },
    {
      id: 'mobile_app_install',
      name: 'Mobile App Install',
      steps: [
        { name: 'App Store Landing', visitors: 15600, dropoff: 0 },
        { name: 'Install Click', visitors: 4680, dropoff: 70 },
        { name: 'App Opened', visitors: 3744, dropoff: 20 },
        { name: 'Account Created', visitors: 1872, dropoff: 50 },
      ],
      conversionRate: 12,
    },
    {
      id: 'webinar_registration',
      name: 'Webinar Registration',
      steps: [
        { name: 'Event Landing Page', visitors: 6400, dropoff: 0 },
        { name: 'Registration Form', visitors: 3200, dropoff: 50 },
        { name: 'Form Submitted', visitors: 2240, dropoff: 30 },
        { name: 'Email Confirmed', visitors: 1568, dropoff: 30 },
        { name: 'Attended Live', visitors: 628, dropoff: 60 },
      ],
      conversionRate: 9.8,
    },
    {
      id: 'premium_upgrade',
      name: 'Premium Upgrade',
      steps: [
        { name: 'Free User Dashboard', visitors: 4200, dropoff: 0 },
        { name: 'Upgrade CTA Click', visitors: 1260, dropoff: 70 },
        { name: 'Plan Selection', visitors: 945, dropoff: 25 },
        { name: 'Payment Info', visitors: 662, dropoff: 30 },
        { name: 'Upgrade Complete', visitors: 464, dropoff: 30 },
      ],
      conversionRate: 11,
    },
    {
      id: 'quote_request',
      name: 'Enterprise Quote Request',
      steps: [
        { name: 'Solutions Page', visitors: 3200, dropoff: 0 },
        { name: 'Get Quote Click', visitors: 960, dropoff: 70 },
        { name: 'Company Info', visitors: 672, dropoff: 30 },
        { name: 'Requirements Form', visitors: 470, dropoff: 30 },
        { name: 'Quote Submitted', visitors: 329, dropoff: 30 },
      ],
      conversionRate: 10.3,
    },
    {
      id: 'demo_booking',
      name: 'Product Demo Booking',
      steps: [
        { name: 'Product Page', visitors: 7800, dropoff: 0 },
        { name: 'Book Demo Click', visitors: 1560, dropoff: 80 },
        { name: 'Calendar View', visitors: 1248, dropoff: 20 },
        { name: 'Time Selected', visitors: 874, dropoff: 30 },
        { name: 'Booking Confirmed', visitors: 612, dropoff: 30 },
      ],
      conversionRate: 7.8,
    },
    {
      id: 'course_enrollment',
      name: 'Online Course Enrollment',
      steps: [
        { name: 'Course Landing', visitors: 11200, dropoff: 0 },
        { name: 'Curriculum View', visitors: 5600, dropoff: 50 },
        { name: 'Enroll Click', visitors: 2240, dropoff: 60 },
        { name: 'Payment Page', visitors: 1568, dropoff: 30 },
        { name: 'Enrollment Complete', visitors: 1098, dropoff: 30 },
      ],
      conversionRate: 9.8,
    },
  ];
};

// Generate heatmap data
export const generateMockHeatmaps = (): HeatmapData[] => {
  const pages = ['/', '/products', '/checkout', '/pricing'];
  const types: ('click' | 'scroll' | 'move')[] = ['click', 'scroll', 'move'];
  
  const heatmaps: HeatmapData[] = [];
  
  pages.forEach((page) => {
    types.forEach((type) => {
      const data: { x: number; y: number; value: number }[] = [];
      const points = type === 'scroll' ? 20 : Math.floor(Math.random() * 50) + 30;
      
      for (let i = 0; i < points; i++) {
        data.push({
          x: Math.random() * 100,
          y: type === 'scroll' ? (i / points) * 100 : Math.random() * 100,
          value: Math.floor(Math.random() * 100) + 1,
        });
      }
      
      heatmaps.push({
        page,
        type,
        data,
        totalSessions: Math.floor(Math.random() * 2000) + 500,
        lastUpdated: new Date().toISOString(),
      });
    });
  });
  
  return heatmaps;
};

// Generate A/B test suggestions based on mock data analysis
export const generateMockABTestSuggestions = (): ABTestSuggestion[] => {
  return [
    {
      id: 'test_1',
      priority: 'high',
      page: '/checkout',
      element: 'CTA Button',
      hypothesis: 'Changing the checkout button color from blue to green will increase conversions by 15%',
      expectedImpact: '+15% conversion rate',
      metrics: ['Conversion Rate', 'Revenue per Session'],
      reasoning: 'Analysis shows 23% rage clicks on the current blue button. Users seem to expect a green "proceed" color based on scroll patterns near the CTA.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dataSource: 'clarity',
    },
    {
      id: 'test_2',
      priority: 'high',
      page: '/products/[id]',
      element: 'Product Images',
      hypothesis: 'Adding a 360° product view will increase add-to-cart rate by 20%',
      expectedImpact: '+20% add-to-cart rate',
      metrics: ['Add to Cart Rate', 'Time on Page', 'Bounce Rate'],
      reasoning: 'Heatmap data shows users spending 40% of their time hovering over product images. 65% scroll depth indicates users are looking for more visual information.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dataSource: 'crazy_egg',
    },
    {
      id: 'test_3',
      priority: 'medium',
      page: '/',
      element: 'Hero Section',
      hypothesis: 'Adding social proof above the fold will reduce bounce rate by 10%',
      expectedImpact: '-10% bounce rate',
      metrics: ['Bounce Rate', 'Scroll Depth', 'Session Duration'],
      reasoning: 'Current bounce rate is 45% with average 3.2 seconds before exit. Users are not scrolling past the hero section to see testimonials.',
      status: 'running',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      dataSource: 'google_analytics',
    },
    {
      id: 'test_4',
      priority: 'medium',
      page: '/cart',
      element: 'Trust Badges',
      hypothesis: 'Adding trust badges near the subtotal will reduce cart abandonment by 12%',
      expectedImpact: '-12% cart abandonment',
      metrics: ['Cart Abandonment', 'Checkout Rate'],
      reasoning: 'Funnel analysis shows 40% drop-off from cart to checkout. Session recordings reveal hesitation near the pricing area.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dataSource: 'combined',
    },
    {
      id: 'test_5',
      priority: 'low',
      page: '/pricing',
      element: 'Pricing Table',
      hypothesis: 'Highlighting the most popular plan will increase plan selection by 25%',
      expectedImpact: '+25% mid-tier plan selection',
      metrics: ['Plan Selection Rate', 'Revenue per User'],
      reasoning: 'Click data shows even distribution across plans. Adding visual hierarchy could guide users toward the recommended option.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dataSource: 'crazy_egg',
    },
    {
      id: 'test_6',
      priority: 'high',
      page: '/checkout',
      element: 'Form Fields',
      hypothesis: 'Reducing checkout form fields from 12 to 6 will increase completion rate by 30%',
      expectedImpact: '+30% checkout completion',
      metrics: ['Form Completion Rate', 'Conversion Rate', 'Time to Complete'],
      reasoning: 'Session recordings show 60% of users abandoning at the address section. Average form completion time is 4.5 minutes, indicating friction.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dataSource: 'clarity',
    },
    {
      id: 'test_7',
      priority: 'medium',
      page: '/products',
      element: 'Product Filters',
      hypothesis: 'Adding sticky filters on mobile will increase product discovery by 18%',
      expectedImpact: '+18% products viewed per session',
      metrics: ['Products Viewed', 'Filter Usage', 'Mobile Conversion'],
      reasoning: 'Mobile users show 50% less filter usage compared to desktop. Scroll depth analysis shows filters disappear too quickly on mobile.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dataSource: 'combined',
    },
    {
      id: 'test_8',
      priority: 'low',
      page: '/blog/[slug]',
      element: 'Related Posts',
      hypothesis: 'Moving related posts above comments will increase pages per session by 15%',
      expectedImpact: '+15% pages per session',
      metrics: ['Pages per Session', 'Session Duration', 'Blog Engagement'],
      reasoning: 'Only 8% of users scroll to the current related posts section. Moving it higher could capture more engaged readers.',
      status: 'completed',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      dataSource: 'google_analytics',
    },
  ];
};

// Generate data sources status
export const generateMockDataSources = (): DataSource[] => {
  return [
    {
      id: 'ds_clarity',
      name: 'Microsoft Clarity',
      type: 'clarity',
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      metrics: {
        sessions: 15420,
        recordings: 8234,
        heatmaps: 12,
      },
    },
    {
      id: 'ds_crazy_egg',
      name: 'Crazy Egg',
      type: 'crazy_egg',
      status: 'connected',
      lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      metrics: {
        sessions: 12300,
        heatmaps: 24,
      },
    },
    {
      id: 'ds_ga',
      name: 'Google Analytics 4',
      type: 'google_analytics',
      status: 'connected',
      lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      metrics: {
        sessions: 45200,
        events: 234500,
      },
    },
  ];
};

// Dashboard summary metrics
export interface DashboardMetrics {
  totalSessions: number;
  totalConversions: number;
  conversionRate: number;
  bounceRate: number;
  avgSessionDuration: number;
  revenueTotal: number;
  sessionsChange: number;
  conversionsChange: number;
  conversionRateChange: number;
  bounceRateChange: number;
  pendingTests: number;
  runningTests: number;
  completedTests: number;
}

export const calculateDashboardMetrics = (sessions: Session[]): DashboardMetrics => {
  const totalSessions = sessions.length;
  const totalConversions = sessions.filter((s) => s.converted).length;
  const totalBounced = sessions.filter((s) => s.bounced).length;
  const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);
  const revenueTotal = sessions.reduce((acc, s) => acc + s.conversionValue, 0);

  const suggestions = generateMockABTestSuggestions();
  
  return {
    totalSessions,
    totalConversions,
    conversionRate: (totalConversions / totalSessions) * 100,
    bounceRate: (totalBounced / totalSessions) * 100,
    avgSessionDuration: totalDuration / totalSessions,
    revenueTotal,
    // Mock changes compared to previous period
    sessionsChange: 12.5,
    conversionsChange: 8.3,
    conversionRateChange: -2.1,
    bounceRateChange: -5.4,
    pendingTests: suggestions.filter((s) => s.status === 'pending').length,
    runningTests: suggestions.filter((s) => s.status === 'running').length,
    completedTests: suggestions.filter((s) => s.status === 'completed').length,
  };
};

// Daily metrics for charts
export interface DailyMetric {
  date: string;
  sessions: number;
  conversions: number;
  revenue: number;
  bounceRate: number;
}

export const calculateDailyMetrics = (sessions: Session[]): DailyMetric[] => {
  const dailyMap: Record<string, { sessions: number; conversions: number; revenue: number; bounced: number }> = {};
  
  sessions.forEach((session) => {
    if (!dailyMap[session.date]) {
      dailyMap[session.date] = { sessions: 0, conversions: 0, revenue: 0, bounced: 0 };
    }
    dailyMap[session.date].sessions++;
    if (session.converted) {
      dailyMap[session.date].conversions++;
      dailyMap[session.date].revenue += session.conversionValue;
    }
    if (session.bounced) {
      dailyMap[session.date].bounced++;
    }
  });
  
  return Object.entries(dailyMap)
    .map(([date, data]) => ({
      date,
      sessions: data.sessions,
      conversions: data.conversions,
      revenue: data.revenue,
      bounceRate: (data.bounced / data.sessions) * 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Traffic sources breakdown
export interface TrafficSource {
  source: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

export const calculateTrafficSources = (sessions: Session[]): TrafficSource[] => {
  const sourceMap: Record<string, { sessions: number; conversions: number; revenue: number }> = {};
  
  sessions.forEach((session) => {
    if (!sourceMap[session.source]) {
      sourceMap[session.source] = { sessions: 0, conversions: 0, revenue: 0 };
    }
    sourceMap[session.source].sessions++;
    if (session.converted) {
      sourceMap[session.source].conversions++;
      sourceMap[session.source].revenue += session.conversionValue;
    }
  });
  
  return Object.entries(sourceMap)
    .map(([source, data]) => ({
      source,
      sessions: data.sessions,
      conversions: data.conversions,
      conversionRate: (data.conversions / data.sessions) * 100,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.sessions - a.sessions);
};

// Device breakdown
export interface DeviceBreakdown {
  device: string;
  sessions: number;
  percentage: number;
  conversionRate: number;
}

export const calculateDeviceBreakdown = (sessions: Session[]): DeviceBreakdown[] => {
  const deviceMap: Record<string, { sessions: number; conversions: number }> = {};
  
  sessions.forEach((session) => {
    if (!deviceMap[session.device]) {
      deviceMap[session.device] = { sessions: 0, conversions: 0 };
    }
    deviceMap[session.device].sessions++;
    if (session.converted) {
      deviceMap[session.device].conversions++;
    }
  });
  
  const total = sessions.length;
  
  return Object.entries(deviceMap)
    .map(([device, data]) => ({
      device,
      sessions: data.sessions,
      percentage: (data.sessions / total) * 100,
      conversionRate: (data.conversions / data.sessions) * 100,
    }))
    .sort((a, b) => b.sessions - a.sessions);
};


