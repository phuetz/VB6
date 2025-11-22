import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVB6Store } from '../../stores/vb6Store';
import { 
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  StarIcon,
  DownloadIcon,
  HeartIcon,
  ShareIcon,
  TagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  CodeBracketSquareIcon,
  PuzzlePieceIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  GiftIcon,
  FireIcon,
  TrendingUpIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  ChevronDownIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// ================================
// ULTRA-MARKETPLACE TYPES
// ================================

interface MarketplaceItem {
  id: string;
  type: 'plugin' | 'template' | 'theme' | 'snippet' | 'component' | 'tool' | 'resource';
  name: string;
  title: string;
  description: string;
  longDescription: string;
  version: string;
  author: MarketplaceAuthor;
  category: string;
  subcategory?: string;
  tags: string[];
  price: {
    type: 'free' | 'paid' | 'freemium' | 'subscription';
    amount?: number;
    currency?: string;
    subscription?: {
      interval: 'monthly' | 'yearly';
      trialDays?: number;
    };
  };
  downloads: number;
  rating: {
    average: number;
    count: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  compatibility: {
    vb6Version: string[];
    platforms: string[];
    dependencies: string[];
  };
  media: {
    icon: string;
    screenshots: string[];
    videos?: string[];
    demo?: string;
  };
  files: {
    size: number;
    mainFile: string;
    additionalFiles?: string[];
    documentation?: string;
  };
  metadata: {
    created: Date;
    updated: Date;
    featured: boolean;
    verified: boolean;
    trending: boolean;
    newRelease: boolean;
    security: {
      scanned: boolean;
      score: number;
      issues: SecurityIssue[];
    };
    performance: {
      score: number;
      metrics: PerformanceMetric[];
    };
  };
  support: {
    documentation: string;
    issues: string;
    forum: string;
    email?: string;
  };
  license: {
    type: string;
    text: string;
    commercial: boolean;
    opensource: boolean;
  };
  reviews: MarketplaceReview[];
  changelog: ChangelogEntry[];
}

interface MarketplaceAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  tier: 'community' | 'verified' | 'partner' | 'staff';
  reputation: number;
  items: number;
  downloads: number;
  joinDate: Date;
  bio?: string;
  website?: string;
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface MarketplaceReview {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
  created: Date;
  updated?: Date;
  response?: {
    author: string;
    content: string;
    created: Date;
  };
}

interface SecurityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  fixed: boolean;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  benchmark: number;
}

interface ChangelogEntry {
  version: string;
  date: Date;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  changes: {
    added?: string[];
    changed?: string[];
    deprecated?: string[];
    removed?: string[];
    fixed?: string[];
    security?: string[];
  };
}

interface MarketplaceCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  count: number;
  subcategories?: {
    id: string;
    name: string;
    count: number;
  }[];
}

interface MarketplaceCollection {
  id: string;
  name: string;
  description: string;
  items: string[];
  author: string;
  featured: boolean;
  public: boolean;
  created: Date;
  updated: Date;
}

interface InstallationProgress {
  itemId: string;
  status: 'downloading' | 'extracting' | 'installing' | 'configuring' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface MarketplaceSearch {
  query: string;
  filters: {
    type?: string[];
    category?: string[];
    price?: 'free' | 'paid' | 'all';
    rating?: number;
    compatibility?: string[];
    author?: string[];
    featured?: boolean;
    trending?: boolean;
    verified?: boolean;
  };
  sort: {
    field: 'relevance' | 'downloads' | 'rating' | 'updated' | 'created' | 'name' | 'price';
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface MarketplaceStats {
  items: {
    total: number;
    by_type: Record<string, number>;
    by_category: Record<string, number>;
    featured: number;
    verified: number;
  };
  downloads: {
    total: number;
    last_30_days: number;
    top_items: Array<{ id: string; name: string; downloads: number }>;
  };
  authors: {
    total: number;
    verified: number;
    active_last_30_days: number;
  };
  revenue: {
    total: number;
    last_30_days: number;
    by_author: Array<{ id: string; name: string; revenue: number }>;
  };
}

// ================================
// ULTRA-MARKETPLACE ENGINE
// ================================

class UltraMarketplaceEngine {
  private items: Map<string, MarketplaceItem> = new Map();
  private authors: Map<string, MarketplaceAuthor> = new Map();
  private collections: Map<string, MarketplaceCollection> = new Map();
  private installations: Map<string, InstallationProgress> = new Map();
  private categories: MarketplaceCategory[] = [];
  private eventListeners: Map<string, ((...args: any[]) => any)[]> = new Map();

  constructor() {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    this.setupCategories();
    this.loadSampleData();
    this.setupEventHandlers();
  }

  private setupCategories(): void {
    this.categories = [
      {
        id: 'plugins',
        name: 'Plugins & Extensions',
        icon: PuzzlePieceIcon,
        description: 'Extend IDE functionality with powerful plugins',
        count: 0,
        subcategories: [
          { id: 'editor', name: 'Editor Enhancements', count: 0 },
          { id: 'debugging', name: 'Debugging Tools', count: 0 },
          { id: 'testing', name: 'Testing Frameworks', count: 0 },
          { id: 'productivity', name: 'Productivity Tools', count: 0 },
          { id: 'integration', name: 'Third-party Integration', count: 0 }
        ]
      },
      {
        id: 'templates',
        name: 'Project Templates',
        icon: DocumentTextIcon,
        description: 'Ready-to-use project templates and scaffolds',
        count: 0,
        subcategories: [
          { id: 'web', name: 'Web Applications', count: 0 },
          { id: 'desktop', name: 'Desktop Applications', count: 0 },
          { id: 'mobile', name: 'Mobile Apps', count: 0 },
          { id: 'api', name: 'APIs & Services', count: 0 },
          { id: 'games', name: 'Games & Graphics', count: 0 }
        ]
      },
      {
        id: 'themes',
        name: 'Themes & UI',
        icon: PaintBrushIcon,
        description: 'Beautiful themes and UI customizations',
        count: 0,
        subcategories: [
          { id: 'dark', name: 'Dark Themes', count: 0 },
          { id: 'light', name: 'Light Themes', count: 0 },
          { id: 'colorful', name: 'Colorful Themes', count: 0 },
          { id: 'minimal', name: 'Minimal Themes', count: 0 },
          { id: 'icons', name: 'Icon Packs', count: 0 }
        ]
      },
      {
        id: 'snippets',
        name: 'Code Snippets',
        icon: CodeBracketSquareIcon,
        description: 'Reusable code snippets and patterns',
        count: 0,
        subcategories: [
          { id: 'vb6', name: 'VB6 Patterns', count: 0 },
          { id: 'database', name: 'Database Code', count: 0 },
          { id: 'ui', name: 'UI Components', count: 0 },
          { id: 'algorithms', name: 'Algorithms', count: 0 },
          { id: 'utilities', name: 'Utility Functions', count: 0 }
        ]
      },
      {
        id: 'components',
        name: 'UI Components',
        icon: CubeIcon,
        description: 'Custom VB6 controls and components',
        count: 0,
        subcategories: [
          { id: 'input', name: 'Input Controls', count: 0 },
          { id: 'display', name: 'Display Controls', count: 0 },
          { id: 'navigation', name: 'Navigation Controls', count: 0 },
          { id: 'data', name: 'Data Controls', count: 0 },
          { id: 'charts', name: 'Charts & Graphs', count: 0 }
        ]
      },
      {
        id: 'tools',
        name: 'Development Tools',
        icon: BoltIcon,
        description: 'Specialized development and productivity tools',
        count: 0,
        subcategories: [
          { id: 'generators', name: 'Code Generators', count: 0 },
          { id: 'analyzers', name: 'Code Analyzers', count: 0 },
          { id: 'formatters', name: 'Code Formatters', count: 0 },
          { id: 'migration', name: 'Migration Tools', count: 0 },
          { id: 'utilities', name: 'General Utilities', count: 0 }
        ]
      }
    ];
  }

  private loadSampleData(): void {
    // Sample authors
    const sampleAuthors: MarketplaceAuthor[] = [
      {
        id: 'vb6-team',
        username: 'vb6team',
        displayName: 'VB6 Core Team',
        avatar: '/avatars/vb6-team.png',
        verified: true,
        tier: 'staff',
        reputation: 10000,
        items: 15,
        downloads: 50000,
        joinDate: new Date('2020-01-01'),
        bio: 'Official VB6 development team'
      },
      {
        id: 'john-dev',
        username: 'johndev',
        displayName: 'John Developer',
        avatar: '/avatars/john.png',
        verified: true,
        tier: 'verified',
        reputation: 8500,
        items: 8,
        downloads: 25000,
        joinDate: new Date('2021-03-15'),
        bio: 'Senior VB6 developer with 10+ years experience'
      },
      {
        id: 'ui-masters',
        username: 'uimasters',
        displayName: 'UI Masters',
        avatar: '/avatars/ui-masters.png',
        verified: true,
        tier: 'partner',
        reputation: 7200,
        items: 12,
        downloads: 30000,
        joinDate: new Date('2021-06-01'),
        bio: 'Specialized in beautiful UI components and themes'
      }
    ];

    sampleAuthors.forEach(author => this.authors.set(author.id, author));

    // Sample marketplace items
    const sampleItems: Omit<MarketplaceItem, 'id'>[] = [
      {
        type: 'plugin',
        name: 'ultra-intellisense',
        title: 'Ultra IntelliSense Pro',
        description: 'Advanced code completion and intelligent suggestions for VB6 development',
        longDescription: 'Ultra IntelliSense Pro revolutionizes VB6 development with AI-powered code completion, intelligent suggestions, and real-time error detection. Features include context-aware autocompletion, parameter hints, documentation preview, and smart code refactoring suggestions.',
        version: '2.1.4',
        author: this.authors.get('vb6-team')!,
        category: 'plugins',
        subcategory: 'editor',
        tags: ['intellisense', 'autocomplete', 'ai', 'productivity'],
        price: { type: 'freemium', amount: 29.99, currency: 'USD' },
        downloads: 15420,
        rating: { average: 4.8, count: 342, distribution: { 5: 280, 4: 45, 3: 12, 2: 3, 1: 2 } },
        compatibility: {
          vb6Version: ['6.0', '6.0+'],
          platforms: ['windows'],
          dependencies: ['microsoft-vb6-runtime']
        },
        media: {
          icon: '/icons/intellisense-pro.png',
          screenshots: [
            '/screenshots/intellisense-1.png',
            '/screenshots/intellisense-2.png',
            '/screenshots/intellisense-3.png'
          ],
          videos: ['/videos/intellisense-demo.mp4'],
          demo: 'https://demo.intellisense-pro.com'
        },
        files: {
          size: 5242880, // 5MB
          mainFile: 'UltraIntelliSense.dll',
          additionalFiles: ['config.json', 'templates/'],
          documentation: 'README.md'
        },
        metadata: {
          created: new Date('2023-01-15'),
          updated: new Date('2024-01-10'),
          featured: true,
          verified: true,
          trending: true,
          newRelease: false,
          security: {
            scanned: true,
            score: 95,
            issues: []
          },
          performance: {
            score: 88,
            metrics: [
              { name: 'Memory Usage', value: 15, unit: 'MB', benchmark: 20 },
              { name: 'Startup Time', value: 250, unit: 'ms', benchmark: 500 }
            ]
          }
        },
        support: {
          documentation: 'https://docs.intellisense-pro.com',
          issues: 'https://github.com/vb6team/intellisense/issues',
          forum: 'https://forum.vb6.com/intellisense',
          email: 'support@vb6team.com'
        },
        license: {
          type: 'Proprietary',
          text: 'Commercial license with 30-day trial',
          commercial: true,
          opensource: false
        },
        reviews: [],
        changelog: [
          {
            version: '2.1.4',
            date: new Date('2024-01-10'),
            type: 'patch',
            changes: {
              fixed: ['Fixed memory leak in autocomplete engine', 'Improved performance for large projects'],
              added: ['New keyboard shortcuts for quick actions']
            }
          }
        ]
      },
      {
        type: 'template',
        name: 'modern-web-app',
        title: 'Modern Web Application Template',
        description: 'Complete template for building modern web applications with VB6 backend',
        longDescription: 'A comprehensive template that includes everything needed to build modern web applications with VB6 backend. Features include REST API setup, database integration, authentication, responsive frontend, and deployment configuration.',
        version: '1.5.2',
        author: this.authors.get('john-dev')!,
        category: 'templates',
        subcategory: 'web',
        tags: ['web', 'api', 'database', 'authentication', 'responsive'],
        price: { type: 'paid', amount: 49.99, currency: 'USD' },
        downloads: 8340,
        rating: { average: 4.6, count: 156, distribution: { 5: 98, 4: 35, 3: 18, 2: 4, 1: 1 } },
        compatibility: {
          vb6Version: ['6.0+'],
          platforms: ['windows'],
          dependencies: ['iis', 'sql-server']
        },
        media: {
          icon: '/icons/web-app-template.png',
          screenshots: [
            '/screenshots/web-template-1.png',
            '/screenshots/web-template-2.png'
          ]
        },
        files: {
          size: 12582912, // 12MB
          mainFile: 'WebApp.vbp',
          additionalFiles: ['database/', 'frontend/', 'docs/'],
          documentation: 'SETUP.md'
        },
        metadata: {
          created: new Date('2023-06-20'),
          updated: new Date('2023-12-15'),
          featured: false,
          verified: true,
          trending: false,
          newRelease: true,
          security: {
            scanned: true,
            score: 92,
            issues: [
              {
                id: 'sec-1',
                severity: 'low',
                type: 'Hardcoded Configuration',
                description: 'Default configuration contains example credentials',
                fixed: false
              }
            ]
          },
          performance: {
            score: 85,
            metrics: [
              { name: 'Build Time', value: 45, unit: 'seconds', benchmark: 60 },
              { name: 'Bundle Size', value: 2.5, unit: 'MB', benchmark: 5 }
            ]
          }
        },
        support: {
          documentation: 'https://github.com/johndev/web-template/wiki',
          issues: 'https://github.com/johndev/web-template/issues',
          forum: 'https://forum.vb6.com/templates'
        },
        license: {
          type: 'MIT',
          text: 'MIT License - free for commercial use',
          commercial: true,
          opensource: true
        },
        reviews: [],
        changelog: []
      },
      {
        type: 'theme',
        name: 'dark-professional',
        title: 'Dark Professional Theme',
        description: 'Elegant dark theme optimized for professional development',
        longDescription: 'A carefully crafted dark theme that reduces eye strain during long coding sessions while maintaining excellent readability and visual hierarchy. Includes syntax highlighting, UI customizations, and multiple color variants.',
        version: '3.2.1',
        author: this.authors.get('ui-masters')!,
        category: 'themes',
        subcategory: 'dark',
        tags: ['dark', 'professional', 'eye-friendly', 'syntax'],
        price: { type: 'free' },
        downloads: 23750,
        rating: { average: 4.9, count: 587, distribution: { 5: 520, 4: 55, 3: 8, 2: 3, 1: 1 } },
        compatibility: {
          vb6Version: ['6.0+'],
          platforms: ['windows'],
          dependencies: []
        },
        media: {
          icon: '/icons/dark-professional.png',
          screenshots: [
            '/screenshots/dark-theme-1.png',
            '/screenshots/dark-theme-2.png',
            '/screenshots/dark-theme-3.png'
          ]
        },
        files: {
          size: 1048576, // 1MB
          mainFile: 'DarkProfessional.theme',
          additionalFiles: ['variants/', 'icons/'],
          documentation: 'INSTALL.md'
        },
        metadata: {
          created: new Date('2022-09-10'),
          updated: new Date('2024-01-05'),
          featured: true,
          verified: true,
          trending: false,
          newRelease: false,
          security: {
            scanned: true,
            score: 100,
            issues: []
          },
          performance: {
            score: 95,
            metrics: [
              { name: 'Theme Load Time', value: 50, unit: 'ms', benchmark: 100 }
            ]
          }
        },
        support: {
          documentation: 'https://uimasters.com/themes/dark-professional',
          issues: 'https://github.com/uimasters/themes/issues',
          forum: 'https://forum.vb6.com/themes'
        },
        license: {
          type: 'CC BY 4.0',
          text: 'Creative Commons Attribution 4.0',
          commercial: true,
          opensource: true
        },
        reviews: [],
        changelog: []
      }
    ];

    // Generate more sample items
    const itemTypes = ['plugin', 'template', 'theme', 'snippet', 'component', 'tool'];
    const categories = this.categories.map(c => c.id);
    
    for (let i = 0; i < 50; i++) {
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)] as any;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const author = Array.from(this.authors.values())[Math.floor(Math.random() * this.authors.size)];
      
      const item: Omit<MarketplaceItem, 'id'> = {
        type,
        name: `sample-${type}-${i + 1}`,
        title: `Sample ${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
        description: `A sample ${type} for demonstration purposes`,
        longDescription: `This is a longer description for the sample ${type}. It provides more details about what this item does and how it can help developers.`,
        version: `1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
        author,
        category,
        tags: [`${type}`, 'sample', 'demo'],
        price: Math.random() > 0.6 ? { type: 'free' } : { type: 'paid', amount: Math.floor(Math.random() * 100) + 10, currency: 'USD' },
        downloads: Math.floor(Math.random() * 10000),
        rating: {
          average: 3 + Math.random() * 2,
          count: Math.floor(Math.random() * 100),
          distribution: { 5: 40, 4: 30, 3: 20, 2: 7, 1: 3 }
        },
        compatibility: {
          vb6Version: ['6.0+'],
          platforms: ['windows'],
          dependencies: []
        },
        media: {
          icon: `/icons/sample-${type}.png`,
          screenshots: [`/screenshots/sample-${type}-1.png`]
        },
        files: {
          size: Math.floor(Math.random() * 10000000),
          mainFile: `sample.${type === 'plugin' ? 'dll' : 'vbp'}`,
          documentation: 'README.md'
        },
        metadata: {
          created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          updated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          featured: Math.random() > 0.8,
          verified: Math.random() > 0.3,
          trending: Math.random() > 0.9,
          newRelease: Math.random() > 0.85,
          security: {
            scanned: true,
            score: 80 + Math.floor(Math.random() * 20),
            issues: []
          },
          performance: {
            score: 70 + Math.floor(Math.random() * 30),
            metrics: []
          }
        },
        support: {
          documentation: 'https://docs.example.com',
          issues: 'https://github.com/example/issues',
          forum: 'https://forum.example.com'
        },
        license: {
          type: Math.random() > 0.5 ? 'MIT' : 'Proprietary',
          text: 'License text here',
          commercial: true,
          opensource: Math.random() > 0.5
        },
        reviews: [],
        changelog: []
      };

      sampleItems.push(item);
    }

    // Add items to the engine with generated IDs
    sampleItems.forEach((item, index) => {
      const id = `item_${Date.now()}_${index}`;
      this.items.set(id, { ...item, id });
    });

    // Update category counts
    this.updateCategoryCounts();
  }

  private updateCategoryCounts(): void {
    // Reset counts
    this.categories.forEach(category => {
      category.count = 0;
      if (category.subcategories) {
        category.subcategories.forEach(sub => sub.count = 0);
      }
    });

    // Count items in each category
    for (const item of this.items.values()) {
      const category = this.categories.find(c => c.id === item.category);
      if (category) {
        category.count++;
        if (category.subcategories && item.subcategory) {
          const subcategory = category.subcategories.find(s => s.id === item.subcategory);
          if (subcategory) {
            subcategory.count++;
          }
        }
      }
    }
  }

  private setupEventHandlers(): void {
    // Setup event handlers for marketplace operations
  }

  public async searchItems(search: MarketplaceSearch): Promise<{ items: MarketplaceItem[], total: number }> {
    let filteredItems = Array.from(this.items.values());

    // Apply text search
    if (search.query) {
      const query = search.query.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.author.displayName.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (search.filters.type && search.filters.type.length > 0) {
      filteredItems = filteredItems.filter(item => search.filters.type!.includes(item.type));
    }

    if (search.filters.category && search.filters.category.length > 0) {
      filteredItems = filteredItems.filter(item => search.filters.category!.includes(item.category));
    }

    if (search.filters.price && search.filters.price !== 'all') {
      if (search.filters.price === 'free') {
        filteredItems = filteredItems.filter(item => item.price.type === 'free');
      } else if (search.filters.price === 'paid') {
        filteredItems = filteredItems.filter(item => item.price.type === 'paid' || item.price.type === 'freemium' || item.price.type === 'subscription');
      }
    }

    if (search.filters.rating) {
      filteredItems = filteredItems.filter(item => item.rating.average >= search.filters.rating!);
    }

    if (search.filters.featured) {
      filteredItems = filteredItems.filter(item => item.metadata.featured);
    }

    if (search.filters.trending) {
      filteredItems = filteredItems.filter(item => item.metadata.trending);
    }

    if (search.filters.verified) {
      filteredItems = filteredItems.filter(item => item.metadata.verified);
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      let comparison = 0;
      
      switch (search.sort.field) {
        case 'relevance':
          // Would implement relevance scoring in a real system
          comparison = 0;
          break;
        case 'downloads':
          comparison = a.downloads - b.downloads;
          break;
        case 'rating':
          comparison = a.rating.average - b.rating.average;
          break;
        case 'updated':
          comparison = a.metadata.updated.getTime() - b.metadata.updated.getTime();
          break;
        case 'created':
          comparison = a.metadata.created.getTime() - b.metadata.created.getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price': {
          const aPrice = a.price.amount || 0;
          const bPrice = b.price.amount || 0;
          comparison = aPrice - bPrice;
          break;
        }
      }

      return search.sort.direction === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const total = filteredItems.length;
    const startIndex = (search.pagination.page - 1) * search.pagination.limit;
    const endIndex = startIndex + search.pagination.limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return { items: paginatedItems, total };
  }

  public async installItem(itemId: string): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    const progress: InstallationProgress = {
      itemId,
      status: 'downloading',
      progress: 0,
      message: 'Starting download...'
    };

    this.installations.set(itemId, progress);
    this.emit('install:started', { itemId, progress });

    try {
      // Simulate download
      for (let i = 0; i <= 100; i += 10) {
        progress.progress = i * 0.6; // 60% for download
        progress.message = `Downloading... ${Math.floor(progress.progress)}%`;
        this.installations.set(itemId, { ...progress });
        this.emit('install:progress', { itemId, progress: { ...progress } });
        await this.sleep(200);
      }

      // Simulate extraction
      progress.status = 'extracting';
      for (let i = 0; i <= 100; i += 20) {
        progress.progress = 60 + (i * 0.2); // 20% for extraction
        progress.message = `Extracting files... ${Math.floor(progress.progress)}%`;
        this.installations.set(itemId, { ...progress });
        this.emit('install:progress', { itemId, progress: { ...progress } });
        await this.sleep(150);
      }

      // Simulate installation
      progress.status = 'installing';
      for (let i = 0; i <= 100; i += 25) {
        progress.progress = 80 + (i * 0.15); // 15% for installation
        progress.message = `Installing... ${Math.floor(progress.progress)}%`;
        this.installations.set(itemId, { ...progress });
        this.emit('install:progress', { itemId, progress: { ...progress } });
        await this.sleep(100);
      }

      // Simulate configuration
      progress.status = 'configuring';
      progress.progress = 95;
      progress.message = 'Configuring...';
      this.installations.set(itemId, { ...progress });
      this.emit('install:progress', { itemId, progress: { ...progress } });
      await this.sleep(300);

      // Complete
      progress.status = 'complete';
      progress.progress = 100;
      progress.message = 'Installation complete!';
      this.installations.set(itemId, { ...progress });
      
      // Update download count
      item.downloads++;
      
      this.emit('install:complete', { itemId, progress: { ...progress } });
    } catch (error) {
      progress.status = 'error';
      progress.error = error instanceof Error ? error.message : 'Installation failed';
      progress.message = 'Installation failed';
      this.installations.set(itemId, { ...progress });
      this.emit('install:error', { itemId, progress: { ...progress }, error });
      throw error;
    }
  }

  public async uninstallItem(itemId: string): Promise<void> {
    // Simulate uninstallation
    await this.sleep(1000);
    this.installations.delete(itemId);
    this.emit('uninstall:complete', { itemId });
  }

  public async addReview(itemId: string, review: Omit<MarketplaceReview, 'id' | 'itemId' | 'created'>): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    const newReview: MarketplaceReview = {
      ...review,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemId,
      created: new Date()
    };

    item.reviews.push(newReview);
    
    // Update rating
    this.updateItemRating(item);
    
    this.emit('review:added', { itemId, review: newReview });
  }

  private updateItemRating(item: MarketplaceItem): void {
    if (item.reviews.length === 0) return;

    const total = item.reviews.reduce((sum, review) => sum + review.rating, 0);
    item.rating.average = total / item.reviews.length;
    item.rating.count = item.reviews.length;

    // Update distribution
    item.rating.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    item.reviews.forEach(review => {
      item.rating.distribution[review.rating as keyof typeof item.rating.distribution]++;
    });
  }

  public getCategories(): MarketplaceCategory[] {
    return this.categories;
  }

  public getItem(id: string): MarketplaceItem | undefined {
    return this.items.get(id);
  }

  public getAuthor(id: string): MarketplaceAuthor | undefined {
    return this.authors.get(id);
  }

  public getInstallation(itemId: string): InstallationProgress | undefined {
    return this.installations.get(itemId);
  }

  public getFeaturedItems(limit: number = 10): MarketplaceItem[] {
    return Array.from(this.items.values())
      .filter(item => item.metadata.featured)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  public getTrendingItems(limit: number = 10): MarketplaceItem[] {
    return Array.from(this.items.values())
      .filter(item => item.metadata.trending)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  public getNewReleases(limit: number = 10): MarketplaceItem[] {
    return Array.from(this.items.values())
      .filter(item => item.metadata.newRelease)
      .sort((a, b) => b.metadata.updated.getTime() - a.metadata.updated.getTime())
      .slice(0, limit);
  }

  public calculateStats(): MarketplaceStats {
    const items = Array.from(this.items.values());
    const authors = Array.from(this.authors.values());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const itemsByType = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const itemsByCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topItems = items
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10)
      .map(item => ({ id: item.id, name: item.title, downloads: item.downloads }));

    return {
      items: {
        total: items.length,
        by_type: itemsByType,
        by_category: itemsByCategory,
        featured: items.filter(i => i.metadata.featured).length,
        verified: items.filter(i => i.metadata.verified).length
      },
      downloads: {
        total: items.reduce((sum, item) => sum + item.downloads, 0),
        last_30_days: 0, // Would calculate from real download data
        top_items: topItems
      },
      authors: {
        total: authors.length,
        verified: authors.filter(a => a.verified).length,
        active_last_30_days: 0 // Would calculate from real activity data
      },
      revenue: {
        total: 0, // Would calculate from real transaction data
        last_30_days: 0,
        by_author: []
      }
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Event system methods
  private addEventListener(event: string, listener: (...args: any[]) => any): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
  }

  public onEvent(event: string, listener: (...args: any[]) => any): void {
    this.addEventListener(event, listener);
  }

  public offEvent(event: string, listener: (...args: any[]) => any): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}

// ================================
// ULTRA-MARKETPLACE COMPONENT
// ================================

export const UltraMarketplace: React.FC = () => {
  const { selectedControl, updateControl } = useVB6Store();
  
  // State management
  const [marketplaceEngine] = useState(() => new UltraMarketplaceEngine());
  const [activeTab, setActiveTab] = useState<'browse' | 'installed' | 'publish' | 'account'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<MarketplaceSearch['filters']>({});
  const [sortField, setSortField] = useState<MarketplaceSearch['sort']['field']>('relevance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  
  const [searchResults, setSearchResults] = useState<MarketplaceItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [categories] = useState(marketplaceEngine.getCategories());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [installations, setInstallations] = useState<Map<string, InstallationProgress>>(new Map());
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Featured items
  const [featuredItems, setFeaturedItems] = useState<MarketplaceItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<MarketplaceItem[]>([]);
  const [newReleases, setNewReleases] = useState<MarketplaceItem[]>([]);

  // Effects
  useEffect(() => {
    loadInitialData();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  useEffect(() => {
    performSearch();
  }, [searchQuery, searchFilters, sortField, sortDirection, currentPage, selectedCategory]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [featured, trending, releases, statsData] = await Promise.all([
        Promise.resolve(marketplaceEngine.getFeaturedItems(8)),
        Promise.resolve(marketplaceEngine.getTrendingItems(8)),
        Promise.resolve(marketplaceEngine.getNewReleases(8)),
        Promise.resolve(marketplaceEngine.calculateStats())
      ]);
      
      setFeaturedItems(featured);
      setTrendingItems(trending);
      setNewReleases(releases);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  }, [marketplaceEngine]);

  const setupEventListeners = useCallback(() => {
    marketplaceEngine.onEvent('install:progress', (data: any) => {
      setInstallations(prev => new Map(prev.set(data.itemId, data.progress)));
    });

    marketplaceEngine.onEvent('install:complete', (data: any) => {
      setInstallations(prev => new Map(prev.set(data.itemId, data.progress)));
      // Could show success notification here
    });

    marketplaceEngine.onEvent('install:error', (data: any) => {
      setInstallations(prev => new Map(prev.set(data.itemId, data.progress)));
      setError(`Installation failed: ${data.error?.message || 'Unknown error'}`);
    });
  }, [marketplaceEngine]);

  const cleanupEventListeners = useCallback(() => {
    // Cleanup would go here
  }, []);

  const performSearch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const search: MarketplaceSearch = {
        query: searchQuery,
        filters: {
          ...searchFilters,
          category: selectedCategory ? [selectedCategory] : searchFilters.category
        },
        sort: {
          field: sortField,
          direction: sortDirection
        },
        pagination: {
          page: currentPage,
          limit: itemsPerPage,
          total: 0
        }
      };

      const results = await marketplaceEngine.searchItems(search);
      setSearchResults(results.items);
      setTotalResults(results.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [marketplaceEngine, searchQuery, searchFilters, selectedCategory, sortField, sortDirection, currentPage, itemsPerPage]);

  const handleInstallItem = useCallback(async (itemId: string) => {
    try {
      await marketplaceEngine.installItem(itemId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed');
    }
  }, [marketplaceEngine]);

  const handleUninstallItem = useCallback(async (itemId: string) => {
    try {
      await marketplaceEngine.uninstallItem(itemId);
      setInstallations(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uninstallation failed');
    }
  }, [marketplaceEngine]);

  const renderStarRating = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIconSolid key={i} className={`${iconSize} text-yellow-400`} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className={`${iconSize} relative`}>
            <StarIcon className={`${iconSize} text-gray-300 absolute`} />
            <StarIconSolid className={`${iconSize} text-yellow-400`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className={`${iconSize} text-gray-300`} />);
      }
    }
    
    return <div className="flex items-center space-x-0.5">{stars}</div>;
  };

  const renderItemCard = (item: MarketplaceItem) => {
    const installation = installations.get(item.id);
    const isInstalling = installation?.status === 'downloading' || installation?.status === 'installing' || installation?.status === 'extracting' || installation?.status === 'configuring';
    const isInstalled = installation?.status === 'complete';

    return (
      <div
        key={item.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={() => setSelectedItem(item)}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {item.title.charAt(0).toUpperCase()}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">by {item.author.displayName}</p>
              </div>
              <div className="flex items-center space-x-1">
                {item.metadata.featured && (
                  <StarIconSolid className="w-3 h-3 text-yellow-500" title="Featured" />
                )}
                {item.metadata.verified && (
                  <ShieldCheckIcon className="w-3 h-3 text-green-500" title="Verified" />
                )}
                {item.metadata.trending && (
                  <TrendingUpIcon className="w-3 h-3 text-red-500" title="Trending" />
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
            
            {/* Rating and Downloads */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                {renderStarRating(item.rating.average, 'sm')}
                <span className="text-xs text-gray-500">({item.rating.count})</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <DownloadIcon className="w-3 h-3" />
                <span>{item.downloads.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Price and Action */}
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm font-medium">
                {item.price.type === 'free' ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span className="text-gray-900">
                    ${item.price.amount}
                    {item.price.type === 'subscription' && '/mo'}
                  </span>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInstalled) {
                    handleUninstallItem(item.id);
                  } else if (!isInstalling) {
                    handleInstallItem(item.id);
                  }
                }}
                disabled={isInstalling}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  isInstalled
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : isInstalling
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {isInstalling ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>{Math.round(installation?.progress || 0)}%</span>
                  </div>
                ) : isInstalled ? (
                  'Uninstall'
                ) : (
                  item.price.type === 'free' ? 'Install' : 'Buy'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBrowseTab = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search plugins, templates, themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
        >
          <FunnelIcon className="w-4 h-4" />
          <span>Filters</span>
        </button>
        <select
          value={`${sortField}-${sortDirection}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split('-');
            setSortField(field as any);
            setSortDirection(direction as any);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="relevance-desc">Most Relevant</option>
          <option value="downloads-desc">Most Downloaded</option>
          <option value="rating-desc">Highest Rated</option>
          <option value="updated-desc">Recently Updated</option>
          <option value="created-desc">Newest</option>
          <option value="name-asc">Name A-Z</option>
          <option value="price-asc">Price: Low to High</option>
        </select>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="space-y-1">
                {['plugin', 'template', 'theme', 'snippet', 'component', 'tool'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={searchFilters.type?.includes(type) || false}
                      onChange={(e) => {
                        const currentTypes = searchFilters.type || [];
                        if (e.target.checked) {
                          setSearchFilters({ ...searchFilters, type: [...currentTypes, type] });
                        } else {
                          setSearchFilters({ ...searchFilters, type: currentTypes.filter(t => t !== type) });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <div className="space-y-1">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'free', label: 'Free' },
                  { value: 'paid', label: 'Paid' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value={option.value}
                      checked={searchFilters.price === option.value || (option.value === 'all' && !searchFilters.price)}
                      onChange={(e) => {
                        setSearchFilters({ 
                          ...searchFilters, 
                          price: e.target.value === 'all' ? undefined : e.target.value as any 
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select
                value={searchFilters.rating || ''}
                onChange={(e) => {
                  setSearchFilters({ 
                    ...searchFilters, 
                    rating: e.target.value ? parseInt(e.target.value) : undefined 
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            {/* Special Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special</label>
              <div className="space-y-1">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.featured || false}
                    onChange={(e) => setSearchFilters({ ...searchFilters, featured: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Featured</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.trending || false}
                    onChange={(e) => setSearchFilters({ ...searchFilters, trending: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Trending</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.verified || false}
                    onChange={(e) => setSearchFilters({ ...searchFilters, verified: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Verified</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchFilters({});
                setShowFilters(false);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Categories */}
      {!searchQuery && !selectedCategory && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-center group"
              >
                <category.icon className="w-8 h-8 mx-auto text-gray-600 group-hover:text-blue-600 transition-colors" />
                <h3 className="text-sm font-medium text-gray-900 mt-2">{category.name}</h3>
                <p className="text-xs text-gray-500">{category.count} items</p>
              </button>
            ))}
          </div>

          {/* Featured Section */}
          {featuredItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <StarIconSolid className="w-5 h-5 text-yellow-500 mr-2" />
                  Featured Items
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredItems.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* Trending Section */}
          {trendingItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FireIcon className="w-5 h-5 text-red-500 mr-2" />
                  Trending Now
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trendingItems.map(renderItemCard)}
              </div>
            </div>
          )}

          {/* New Releases */}
          {newReleases.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="w-5 h-5 text-green-500 mr-2" />
                  New Releases
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {newReleases.map(renderItemCard)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Search Results */}
      {(searchQuery || selectedCategory) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Back to all categories
                </button>
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                {searchQuery ? `Search Results for "${searchQuery}"` : 
                 selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Items'}
              </h2>
              <span className="text-sm text-gray-500">({totalResults} items)</span>
            </div>
          </div>
          
          {searchResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map(renderItemCard)}
              </div>
              
              {/* Pagination */}
              {totalResults > itemsPerPage && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {Math.ceil(totalResults / itemsPerPage)}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(totalResults / itemsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(totalResults / itemsPerPage)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderInstalledTab = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Installed Items</h2>
      
      {installations.size > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(installations.entries()).map(([itemId, installation]) => {
            const item = marketplaceEngine.getItem(itemId);
            if (!item || installation.status !== 'complete') return null;
            
            return (
              <div
                key={itemId}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-500">v{item.version}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleUninstallItem(itemId)}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200"
                  >
                    Uninstall
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No installed items</h3>
          <p className="text-gray-600">Browse the marketplace to install plugins, themes, and more</p>
          <button
            onClick={() => setActiveTab('browse')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Marketplace
          </button>
        </div>
      )}
    </div>
  );

  if (isLoading && searchResults.length === 0 && featuredItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <div className="text-sm text-gray-500">Loading marketplace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ultra Marketplace</h1>
              <p className="text-sm text-gray-600">Discover plugins, templates, themes and more</p>
            </div>
          </div>
          
          {stats && (
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{stats.items.total.toLocaleString()}</div>
                <div>Total Items</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{stats.downloads.total.toLocaleString()}</div>
                <div>Downloads</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{stats.authors.total.toLocaleString()}</div>
                <div>Authors</div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            {[
              { key: 'browse', label: 'Browse', icon: MagnifyingGlassIcon },
              { key: 'installed', label: 'Installed', icon: DownloadIcon },
              { key: 'publish', label: 'Publish', icon: CloudArrowUpIcon },
              { key: 'account', label: 'Account', icon: UserIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 mx-6 mt-4 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'browse' && renderBrowseTab()}
        {activeTab === 'installed' && renderInstalledTab()}
        {activeTab === 'publish' && (
          <div className="text-center py-12">
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Publish Your Items</h3>
            <p className="text-gray-600">Coming soon - share your creations with the community</p>
          </div>
        )}
        {activeTab === 'account' && (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Management</h3>
            <p className="text-gray-600">Coming soon - manage your profile and purchases</p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-sm font-medium text-gray-700">Loading...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UltraMarketplace;