// Backend model categories
export const ticketCategories = [
  'Incident',
  'Request',
  'Problem',
  'Change',
] as const;

export type TicketCategory = typeof ticketCategories[number];

export interface PredictionResult {
  category: TicketCategory;
  confidence: number;
  topCategories: Array<{ category: TicketCategory; score: number }>;
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  subject: string;
  body: string;
  category: TicketCategory;
  confidence: number;
}

export const generateMockPrediction = (subject: string, body: string): PredictionResult => {
  const text = `${subject} ${body}`.toLowerCase();
  let primaryCategory: TicketCategory = 'Incident';

  if (text.includes('password') || text.includes('login') || text.includes('credential')) {
    primaryCategory = 'Incident';
  } else if (text.includes('request') || text.includes('access') || text.includes('need')) {
    primaryCategory = 'Request';
  } else if (text.includes('error') || text.includes('issue') || text.includes('bug')) {
    primaryCategory = 'Problem';
  } else if (text.includes('update') || text.includes('deploy') || text.includes('change')) {
    primaryCategory = 'Change';
  }

  const confidence = Math.random() * 0.25 + 0.7;
  const otherCategories = ticketCategories
    .filter(c => c !== primaryCategory)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const remainingConfidence = Math.max(0, 1 - confidence);
  const score1 = remainingConfidence * 0.6;
  const score2 = remainingConfidence * 0.4;

  return {
    category: primaryCategory,
    confidence,
    topCategories: [
      { category: primaryCategory, score: confidence },
      { category: otherCategories[0], score: score1 },
      { category: otherCategories[1], score: score2 },
    ],
  };
};

export const generateMockHistory = (): HistoryItem[] => {
  const subjects = [
    "User locked out of VPN",
    "Access request for billing app",
    "Payment system throwing 500 errors",
    "Deploy new email template",
    "Password reset loop",
    "Need VPN access for contractor",
    "API change request for webhook",
    "Mobile app crashes on login",
  ];

  const bodies = [
    "After multiple attempts the user cannot login.",
    "Please provision role-based access for finance.",
    "Errors appeared after last release.",
    "We want to update branding in outgoing emails.",
    "Reset link keeps expiring immediately.",
    "Contractor onboarded today needs VPN access.",
    "Webhook needs to include new fields.",
    "Crash happens consistently on version 2.1.",
  ];

  return Array.from({ length: 12 }, (_, i) => {
    const randomCategory = ticketCategories[Math.floor(Math.random() * ticketCategories.length)];
    const daysAgo = Math.floor(Math.random() * 14);
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      subject: subjects[i % subjects.length],
      body: bodies[i % bodies.length],
      category: randomCategory,
      confidence: Math.random() * 0.2 + 0.7,
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generateChartData = (history: HistoryItem[]) => {
  const categoryData = ticketCategories.map(category => ({
    category,
    count: history.filter(item => item.category === category).length,
  }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayKey = date.toDateString();
    const predictions = history.filter(item => item.timestamp.toDateString() === dayKey).length;
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      predictions,
    };
  });

  return { categoryData, timeSeriesData: last7Days };
};

export const categoryColors: Record<TicketCategory, string> = {
  Incident: '#6366f1',
  Request: '#10b981',
  Problem: '#f97316',
  Change: '#eab308',
};
