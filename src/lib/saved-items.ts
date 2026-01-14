// Sistema di salvataggio per Funnels e Landing Pages

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface SavedFunnel {
  id: string;
  name: string;
  categoryId: string;
  url?: string;
  steps: {
    name: string;
    url: string;
    visitors?: number;
    dropoff?: number;
  }[];
  analysis?: CROAnalysis;
  savedAt: string;
  lastUpdated: string;
}

export interface SavedLandingPage {
  id: string;
  name: string;
  categoryId: string;
  url: string;
  analysis?: CROAnalysis;
  savedAt: string;
  lastUpdated: string;
}

export interface CROAnalysis {
  generatedAt: string;
  comparisonTable: CROTableRow[];
  summary: string;
  expectedImpact: {
    totalLift: string;
    confidence: number;
  };
}

export interface CROTableRow {
  id: number;
  metricObserved: string;
  whatYouSee: string;
  correctAssumption: string;
  wrongAssumption: string;
  practicalTest: {
    title: string;
    from: string;
    to: string;
    details?: string[];
  };
  expectedLift: string;
  kpiToObserve: string[];
  runTest: {
    startDate?: string;
    status: 'not-started' | 'running' | 'completed';
  };
  experimentFeedback?: {
    controlRPV?: number;
    variantRPV?: number;
    result?: 'win' | 'loss' | 'inconclusive';
  };
}

// Local Storage helpers
const STORAGE_KEYS = {
  CATEGORIES: 'cro_categories',
  FUNNELS: 'cro_saved_funnels',
  LANDING_PAGES: 'cro_saved_landing_pages',
};

export const categoryStorage = {
  getAll: (): Category[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : getDefaultCategories();
  },

  save: (category: Category): void => {
    const categories = categoryStorage.getAll();
    const existing = categories.findIndex(c => c.id === category.id);
    if (existing >= 0) {
      categories[existing] = category;
    } else {
      categories.push(category);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  delete: (categoryId: string): void => {
    const categories = categoryStorage.getAll().filter(c => c.id !== categoryId);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },
};

export const funnelStorage = {
  getAll: (): SavedFunnel[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.FUNNELS);
    return data ? JSON.parse(data) : [];
  },

  getById: (id: string): SavedFunnel | null => {
    const funnels = funnelStorage.getAll();
    return funnels.find(f => f.id === id) || null;
  },

  save: (funnel: SavedFunnel): void => {
    const funnels = funnelStorage.getAll();
    const existing = funnels.findIndex(f => f.id === funnel.id);
    if (existing >= 0) {
      funnels[existing] = { ...funnel, lastUpdated: new Date().toISOString() };
    } else {
      funnels.push(funnel);
    }
    localStorage.setItem(STORAGE_KEYS.FUNNELS, JSON.stringify(funnels));
  },

  delete: (funnelId: string): void => {
    const funnels = funnelStorage.getAll().filter(f => f.id !== funnelId);
    localStorage.setItem(STORAGE_KEYS.FUNNELS, JSON.stringify(funnels));
  },
};

export const landingPageStorage = {
  getAll: (): SavedLandingPage[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.LANDING_PAGES);
    return data ? JSON.parse(data) : [];
  },

  getById: (id: string): SavedLandingPage | null => {
    const pages = landingPageStorage.getAll();
    return pages.find(p => p.id === id) || null;
  },

  save: (page: SavedLandingPage): void => {
    const pages = landingPageStorage.getAll();
    const existing = pages.findIndex(p => p.id === page.id);
    if (existing >= 0) {
      pages[existing] = { ...page, lastUpdated: new Date().toISOString() };
    } else {
      pages.push(page);
    }
    localStorage.setItem(STORAGE_KEYS.LANDING_PAGES, JSON.stringify(pages));
  },

  delete: (pageId: string): void => {
    const pages = landingPageStorage.getAll().filter(p => p.id !== pageId);
    localStorage.setItem(STORAGE_KEYS.LANDING_PAGES, JSON.stringify(pages));
  },
};

function getDefaultCategories(): Category[] {
  return [
    {
      id: 'cat_ecommerce',
      name: 'E-commerce',
      color: '#7c5cff',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_saas',
      name: 'SaaS',
      color: '#00d4aa',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_leadgen',
      name: 'Lead Generation',
      color: '#f59e0b',
      createdAt: new Date().toISOString(),
    },
  ];
}
