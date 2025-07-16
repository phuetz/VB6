/**
 * Marketplace Component
 * Integrated marketplace for VB6 components, templates, and plugins
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pluginSystem } from '../../services/PluginSystem';
import { eventSystem } from '../../services/VB6EventSystem';
import { useVB6Store } from '../../stores/vb6Store';

interface MarketplaceItem {
  id: string;
  type: 'plugin' | 'template' | 'component' | 'theme' | 'snippet';
  name: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  version: string;
  price: number | 'free';
  currency?: string;
  downloads: number;
  rating: number;
  reviews: number;
  tags: string[];
  screenshots: string[];
  compatibility: string[];
  size: string;
  lastUpdated: Date;
  installed?: boolean;
  featured?: boolean;
  trending?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

export const Marketplace: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'price'>('popular');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [installingItems, setInstallingItems] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<MarketplaceItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);

  // Categories
  const categories: Category[] = [
    { id: 'all', name: 'All Items', icon: '🎯', count: 150 },
    { id: 'plugin', name: 'Plugins', icon: '🔌', count: 45 },
    { id: 'template', name: 'Templates', icon: '📋', count: 32 },
    { id: 'component', name: 'Components', icon: '🧩', count: 38 },
    { id: 'theme', name: 'Themes', icon: '🎨', count: 18 },
    { id: 'snippet', name: 'Snippets', icon: '✂️', count: 17 },
  ];

  // Mock marketplace items
  useEffect(() => {
    const items: MarketplaceItem[] = [
      {
        id: 'adv-datagrid',
        type: 'component',
        name: 'Advanced DataGrid Pro',
        description: 'Professional data grid with sorting, filtering, grouping, and Excel export',
        author: { name: 'GridMaster Inc', verified: true },
        version: '3.2.1',
        price: 49.99,
        currency: 'USD',
        downloads: 12543,
        rating: 4.8,
        reviews: 287,
        tags: ['grid', 'data', 'table', 'excel', 'export'],
        screenshots: ['/screenshots/grid1.png', '/screenshots/grid2.png'],
        compatibility: ['VB6 SP6', 'Windows 10/11'],
        size: '2.4 MB',
        lastUpdated: new Date('2024-01-15'),
        featured: true,
        trending: true,
      },
      {
        id: 'crystal-reports-plus',
        type: 'plugin',
        name: 'Crystal Reports Plus',
        description: 'Enhanced Crystal Reports integration with modern features',
        author: { name: 'ReportPro', verified: true },
        version: '2.0.0',
        price: 79.99,
        currency: 'USD',
        downloads: 8932,
        rating: 4.6,
        reviews: 156,
        tags: ['reporting', 'crystal', 'pdf', 'export'],
        screenshots: ['/screenshots/crystal1.png'],
        compatibility: ['VB6', 'Crystal Reports 11+'],
        size: '5.8 MB',
        lastUpdated: new Date('2024-01-10'),
        featured: true,
      },
      {
        id: 'modern-ui-kit',
        type: 'theme',
        name: 'Modern UI Kit',
        description: 'Beautiful modern UI components and themes for VB6',
        author: { name: 'UIDesigner', verified: false },
        version: '1.5.0',
        price: 'free',
        downloads: 23456,
        rating: 4.9,
        reviews: 432,
        tags: ['ui', 'modern', 'theme', 'design'],
        screenshots: ['/screenshots/ui1.png', '/screenshots/ui2.png'],
        compatibility: ['VB6'],
        size: '1.2 MB',
        lastUpdated: new Date('2024-01-20'),
        trending: true,
      },
      {
        id: 'db-helper',
        type: 'snippet',
        name: 'Database Helper Functions',
        description: 'Collection of useful database helper functions and utilities',
        author: { name: 'DBGuru' },
        version: '1.0.0',
        price: 'free',
        downloads: 15234,
        rating: 4.7,
        reviews: 89,
        tags: ['database', 'sql', 'helper', 'utility'],
        screenshots: [],
        compatibility: ['VB6'],
        size: '156 KB',
        lastUpdated: new Date('2024-01-18'),
      },
      {
        id: 'form-wizard',
        type: 'template',
        name: 'Form Wizard Template',
        description: 'Multi-step form wizard with validation and progress tracking',
        author: { name: 'FormMaster', verified: true },
        version: '2.1.0',
        price: 19.99,
        currency: 'USD',
        downloads: 6789,
        rating: 4.5,
        reviews: 67,
        tags: ['form', 'wizard', 'template', 'validation'],
        screenshots: ['/screenshots/wizard1.png'],
        compatibility: ['VB6'],
        size: '890 KB',
        lastUpdated: new Date('2024-01-12'),
      },
      {
        id: 'chart-control',
        type: 'component',
        name: 'Advanced Chart Control',
        description: 'Professional charting component with 50+ chart types',
        author: { name: 'ChartPro Solutions', verified: true },
        version: '4.0.0',
        price: 99.99,
        currency: 'USD',
        downloads: 4567,
        rating: 4.9,
        reviews: 123,
        tags: ['chart', 'graph', 'visualization', 'analytics'],
        screenshots: ['/screenshots/chart1.png', '/screenshots/chart2.png'],
        compatibility: ['VB6 SP6'],
        size: '3.7 MB',
        lastUpdated: new Date('2024-01-08'),
        featured: true,
      },
    ];

    setMarketplaceItems(items);
  }, []);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = marketplaceItems;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.type === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(item => item.price === 'free');
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(item => item.price !== 'free');
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'recent':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'price': {
          const priceA = a.price === 'free' ? 0 : a.price;
          const priceB = b.price === 'free' ? 0 : b.price;
          return priceA - priceB;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [marketplaceItems, selectedCategory, searchQuery, priceFilter, sortBy]);

  const installItem = async (item: MarketplaceItem) => {
    setInstallingItems(prev => new Set(prev).add(item.id));

    try {
      // Simulate installation
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (item.type === 'plugin') {
        // Install as plugin
        await pluginSystem.installPlugin(`/marketplace/${item.id}`);
      }

      // Mark as installed
      setMarketplaceItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, installed: true } : i)
      );

      eventSystem.fire('Marketplace', 'ItemInstalled', { item });
      showNotification(`${item.name} installed successfully!`);
    } catch (error) {
      showNotification(`Failed to install ${item.name}`, 'error');
    } finally {
      setInstallingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const addToCart = (item: MarketplaceItem) => {
    if (item.price === 'free') {
      installItem(item);
    } else {
      setCart(prev => [...prev, item]);
      showNotification(`${item.name} added to cart`);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const checkout = () => {
    // Simulate checkout process
    showNotification('Redirecting to checkout...', 'info');
    setShowCart(false);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    eventSystem.fire('Marketplace', 'Notification', { message, type });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  const renderPrice = (item: MarketplaceItem) => {
    if (item.price === 'free') {
      return <span className="text-green-600 font-semibold">FREE</span>;
    }
    return (
      <span className="text-gray-900 dark:text-white font-semibold">
        ${item.price} {item.currency}
      </span>
    );
  };

  return (
    <>
      {/* Marketplace Button */}
      <motion.button
        className="fixed top-24 right-72 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg shadow-lg z-40 flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>🛒</span>
        <span>Marketplace</span>
        {cart.length > 0 && (
          <span className="bg-white text-orange-600 text-xs px-2 py-0.5 rounded-full">
            {cart.length}
          </span>
        )}
      </motion.button>

      {/* Marketplace Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">VB6 Marketplace</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Discover plugins, templates, and components
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowCart(!showCart)}
                      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <span className="text-xl">🛒</span>
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {cart.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Search and filters */}
                <div className="mt-4 flex gap-4">
                  <input
                    type="text"
                    placeholder="Search marketplace..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border dark:border-gray-700 rounded-lg"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="recent">Recently Updated</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price">Price: Low to High</option>
                  </select>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value as any)}
                    className="px-4 py-2 border dark:border-gray-700 rounded-lg"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free Only</option>
                    <option value="paid">Paid Only</option>
                  </select>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Categories sidebar */}
                <div className="w-64 border-r dark:border-gray-800 p-4">
                  <h3 className="font-semibold mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{category.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* Featured section */}
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">Featured</h3>
                    <div className="space-y-2">
                      <button className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        🔥 Trending Now
                      </button>
                      <button className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        ⭐ Top Rated
                      </button>
                      <button className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        🆕 New Releases
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items grid */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-3 gap-6">
                      {filteredItems.map(item => (
                        <motion.div
                          key={item.id}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                          whileHover={{ y: -4 }}
                          onClick={() => setSelectedItem(item)}
                        >
                          {/* Item thumbnail */}
                          <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-t-lg relative overflow-hidden">
                            {item.featured && (
                              <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                Featured
                              </span>
                            )}
                            {item.trending && (
                              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                🔥 Trending
                              </span>
                            )}
                            <div className="h-full flex items-center justify-center text-4xl opacity-50">
                              {item.type === 'plugin' && '🔌'}
                              {item.type === 'template' && '📋'}
                              {item.type === 'component' && '🧩'}
                              {item.type === 'theme' && '🎨'}
                              {item.type === 'snippet' && '✂️'}
                            </div>
                          </div>

                          {/* Item details */}
                          <div className="p-4">
                            <h4 className="font-semibold text-lg mb-1">{item.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {item.description}
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 bg-gray-300 rounded-full" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {item.author.name}
                              </span>
                              {item.author.verified && (
                                <span className="text-blue-500 text-xs">✓</span>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between mb-3">
                              {renderStars(item.rating)}
                              <span className="text-xs text-gray-500">
                                {item.downloads.toLocaleString()} downloads
                              </span>
                            </div>

                            {/* Price and action */}
                            <div className="flex items-center justify-between">
                              {renderPrice(item)}
                              {item.installed ? (
                                <span className="text-green-600 text-sm">✓ Installed</span>
                              ) : installingItems.has(item.id) ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent" />
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                                >
                                  {item.price === 'free' ? 'Install' : 'Add to Cart'}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No items found matching your criteria
                    </div>
                  )}
                </div>

                {/* Cart sidebar */}
                <AnimatePresence>
                  {showCart && (
                    <motion.div
                      initial={{ x: 300 }}
                      animate={{ x: 0 }}
                      exit={{ x: 300 }}
                      className="w-80 border-l dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800"
                    >
                      <h3 className="font-semibold mb-4">Shopping Cart</h3>
                      {cart.length > 0 ? (
                        <>
                          <div className="space-y-3 mb-4">
                            {cart.map(item => (
                              <div
                                key={item.id}
                                className="bg-white dark:bg-gray-900 p-3 rounded-lg"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-medium">{item.name}</h5>
                                    <p className="text-sm text-gray-600">
                                      {item.type} • v{item.version}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="mt-2 text-right">
                                  <span className="font-semibold">
                                    ${item.price} {item.currency}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Total */}
                          <div className="border-t dark:border-gray-700 pt-4">
                            <div className="flex justify-between mb-4">
                              <span className="font-semibold">Total:</span>
                              <span className="font-bold text-lg">
                                $
                                {cart
                                  .reduce(
                                    (sum, item) =>
                                      sum + (item.price === 'free' ? 0 : item.price),
                                    0
                                  )
                                  .toFixed(2)}{' '}
                                USD
                              </span>
                            </div>
                            <button
                              onClick={checkout}
                              className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              Proceed to Checkout
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          Your cart is empty
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{selectedItem.name}</h2>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600 dark:text-gray-400">
                        v{selectedItem.version}
                      </span>
                      {renderStars(selectedItem.rating)}
                      <span className="text-sm text-gray-500">
                        {selectedItem.reviews} reviews
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Screenshots */}
                {selectedItem.screenshots.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedItem.screenshots.map((screenshot, index) => (
                        <div
                          key={index}
                          className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium mb-2">Author</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full" />
                      <span>{selectedItem.author.name}</span>
                      {selectedItem.author.verified && (
                        <span className="text-blue-500">✓ Verified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Compatibility</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedItem.compatibility.join(', ')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Size</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedItem.size}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Last Updated</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedItem.lastUpdated.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      addToCart(selectedItem);
                      setSelectedItem(null);
                    }}
                    disabled={selectedItem.installed || installingItems.has(selectedItem.id)}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {selectedItem.installed
                      ? '✓ Installed'
                      : installingItems.has(selectedItem.id)
                      ? 'Installing...'
                      : selectedItem.price === 'free'
                      ? 'Install Now'
                      : `Buy for $${selectedItem.price}`}
                  </button>
                  <button className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    View Documentation
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Marketplace;