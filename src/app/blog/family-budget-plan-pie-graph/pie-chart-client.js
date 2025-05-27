'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BlogPageNavbar from '../blogPageNavbar';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export default function FamilyBudgetPieChartClient() {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Housing', amount: '', color: '#ef4444' },
    { id: 2, name: 'Food', amount: '', color: '#f97316' },
    { id: 3, name: 'Transportation', amount: '', color: '#eab308' },
    { id: 4, name: 'Utilities', amount: '', color: '#22c55e' },
    { id: 5, name: 'Entertainment', amount: '', color: '#3b82f6' },
  ]);

  const [validationErrors, setValidationErrors] = useState({});
  const [totalBudget, setTotalBudget] = useState(0);

  // Default colors for new categories - expanded palette
  const defaultColors = [
    // Reds
    '#ef4444',
    '#dc2626',
    '#b91c1c',
    '#991b1b',
    '#fca5a5',
    '#f87171',
    // Oranges
    '#f97316',
    '#ea580c',
    '#c2410c',
    '#9a3412',
    '#fdba74',
    '#fb923c',
    // Yellows
    '#eab308',
    '#ca8a04',
    '#a16207',
    '#854d0e',
    '#fde047',
    '#facc15',
    // Greens
    '#22c55e',
    '#16a34a',
    '#15803d',
    '#166534',
    '#86efac',
    '#4ade80',
    '#10b981',
    '#059669',
    '#047857',
    '#065f46',
    '#6ee7b7',
    '#34d399',
    '#84cc16',
    '#65a30d',
    '#4d7c0f',
    '#365314',
    '#bef264',
    '#a3e635',
    // Blues
    '#3b82f6',
    '#2563eb',
    '#1d4ed8',
    '#1e40af',
    '#93c5fd',
    '#60a5fa',
    '#0ea5e9',
    '#0284c7',
    '#0369a1',
    '#075985',
    '#7dd3fc',
    '#38bdf8',
    '#06b6d4',
    '#0891b2',
    '#0e7490',
    '#155e75',
    '#67e8f9',
    '#22d3ee',
    // Purples
    '#8b5cf6',
    '#7c3aed',
    '#6d28d9',
    '#5b21b6',
    '#c4b5fd',
    '#a78bfa',
    '#a855f7',
    '#9333ea',
    '#7e22ce',
    '#6b21a8',
    '#d8b4fe',
    '#c084fc',
    '#ec4899',
    '#db2777',
    '#be185d',
    '#9d174d',
    '#f9a8d4',
    '#f472b6',
    // Teals
    '#14b8a6',
    '#0d9488',
    '#0f766e',
    '#115e59',
    '#5eead4',
    '#2dd4bf',
    // Indigos
    '#6366f1',
    '#4f46e5',
    '#4338ca',
    '#3730a3',
    '#a5b4fc',
    '#818cf8',
    // Pinks
    '#f43f5e',
    '#e11d48',
    '#be123c',
    '#9f1239',
    '#fda4af',
    '#fb7185',
    // Grays
    '#6b7280',
    '#4b5563',
    '#374151',
    '#1f2937',
    '#9ca3af',
    '#d1d5db',
    // Additional vibrant colors
    '#ff6b6b',
    '#4ecdc4',
    '#45b7d1',
    '#96ceb4',
    '#ffeaa7',
    '#dda0dd',
    '#98d8c8',
    '#f7dc6f',
    '#bb8fce',
    '#85c1e9',
    '#f8c471',
    '#82e0aa',
    '#aed6f1',
    '#f9e79f',
    '#d7bde2',
    '#a9dfbf',
    '#fadbd8',
    '#d5f4e6',
    '#fdeaa7',
    '#e8daef',
    '#d6eaf8',
    '#fff2cc',
    '#ebf5fb',
    '#fef9e7',
    // Dark variants
    '#8b0000',
    '#006400',
    '#000080',
    '#800080',
    '#b8860b',
    '#2f4f4f',
    '#556b2f',
    '#8b4513',
    '#483d8b',
    '#008b8b',
    '#9932cc',
    '#8fbc8f',
    '#ff1493',
    '#00ced1',
    '#ff4500',
    '#da70d6',
    '#eee8aa',
    '#98fb98',
    '#afeeee',
    '#db7093',
    '#ffdab9',
    '#cd853f',
    '#ffc0cb',
    '#dda0dd',
    // Light variants
    '#ffb3ba',
    '#ffdfba',
    '#ffffba',
    '#baffc9',
    '#bae1ff',
    '#e6baff',
    '#ffcccb',
    '#ffd700',
    '#add8e6',
    '#90ee90',
    '#ffb6c1',
    '#dda0dd',
    '#f0e68c',
    '#e0ffff',
    '#faf0e6',
    '#d3d3d3',
    '#ffe4e1',
    '#f5deb3',
  ];

  useEffect(() => {
    calculateTotal();
  }, [categories]);

  const calculateTotal = () => {
    const total = categories.reduce((sum, cat) => {
      const amount = parseFloat(cat.amount) || 0;
      return sum + amount;
    }, 0);
    setTotalBudget(total);
  };

  // Transform categories into Recharts data format
  const getChartData = () => {
    return categories
      .filter((cat) => cat.name.trim() && parseFloat(cat.amount) > 0)
      .map((cat) => ({
        name: cat.name,
        value: parseFloat(cat.amount),
        color: cat.color,
        percentage: ((parseFloat(cat.amount) / totalBudget) * 100).toFixed(1),
      }));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">
            Amount: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const addCategory = () => {
    if (categories.length >= 100) return;

    const newId = Math.max(...categories.map((c) => c.id)) + 1;
    const colorIndex = categories.length % defaultColors.length;

    setCategories([
      ...categories,
      {
        id: newId,
        name: '',
        amount: '',
        color: defaultColors[colorIndex],
      },
    ]);
  };

  const removeCategory = (id) => {
    if (categories.length <= 1) return;
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  const updateCategory = (id, field, value) => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    );

    // Clear validation error for this category
    if (validationErrors[id]) {
      setValidationErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let hasValidEntries = false;

    categories.forEach((category) => {
      if (category.name.trim() && category.amount) {
        hasValidEntries = true;
        if (!category.name.trim()) {
          errors[category.id] = 'Category name is required';
        }
        if (!category.amount || parseFloat(category.amount) <= 0) {
          errors[category.id] = 'Amount must be greater than 0';
        }
      }
    });

    if (!hasValidEntries) {
      errors.general = 'Please add at least one category with name and amount';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateChart = () => {
    validateForm();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <BlogPageNavbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 text-gray-600 font-serif mt-12">
        <Link
          href="/blog"
          className="inline-flex items-center text-amber-800 hover:text-amber-900 mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Blog
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Family Budget Plan Pie Chart Generator
          </h1>
          <p className="text-xl text-gray-600 italic mb-6 font-serif">
            Create visual pie charts for your family budget. Enter up to 100
            categories and see your spending breakdown instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Budget Categories
              </h2>
              <div className="text-sm text-gray-500">
                {categories.length}/100 categories
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={category.color}
                      onChange={(e) =>
                        updateCategory(category.id, 'color', e.target.value)
                      }
                      className="w-8 h-8 rounded cursor-pointer border"
                    />
                    <input
                      type="text"
                      placeholder="Category name"
                      value={category.name}
                      onChange={(e) =>
                        updateCategory(category.id, 'name', e.target.value)
                      }
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        validationErrors[category.id]
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        value={category.amount}
                        onChange={(e) =>
                          updateCategory(category.id, 'amount', e.target.value)
                        }
                        className={`pl-8 w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          validationErrors[category.id]
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                  {categories.length > 1 && (
                    <button
                      onClick={() => removeCategory(category.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {Object.keys(validationErrors).length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  {validationErrors.general || 'Please fix the errors above'}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={addCategory}
                disabled={categories.length >= 100}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Add Category ({categories.length}/100)
              </button>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm text-amber-800 mb-1">
                    Total Budget
                  </div>
                  <div className="text-2xl font-bold text-amber-900">
                    {formatCurrency(totalBudget)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Budget Visualization
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Hover over chart sections for details
            </p>

            <div className="flex flex-col items-center">
              <div className="w-full h-80 mb-6">
                {totalBudget > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getChartData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-16">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p className="text-sm">
                      Add categories and amounts to see your budget
                      visualization
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Hover over chart sections for details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Educational Content */}
        <article className="mt-12 prose prose-lg max-w-none text-black prose-headings:text-gray-900 prose-a:text-amber-800 prose-a:no-underline prose-img:rounded-md prose-h2:text-xl prose-p:font-serif prose-p:leading-relaxed prose-ul:-mt-[16px] prose-li:marker:text-black">
          <h2>Understanding Your Budget with Visual Charts</h2>

          <p>
            Visual budget planning helps you understand where your money goes
            each month. This pie chart generator lets you create clear, colorful
            representations of your family&apos;s spending categories.
          </p>

          <h3>Benefits of Visual Budget Planning</h3>

          <ul>
            <li>
              <strong>Quick Overview:</strong> See your spending breakdown at a
              glance
            </li>
            <li>
              <strong>Identify Patterns:</strong> Spot categories that take up
              more budget than expected
            </li>
            <li>
              <strong>Set Priorities:</strong> Visually compare different
              spending areas
            </li>
            <li>
              <strong>Track Progress:</strong> Monitor changes in spending over
              time
            </li>
          </ul>

          <h3>How to Use This Tool Effectively</h3>

          <ul>
            <li>
              Start with your major expense categories like housing, food, and
              transportation
            </li>
            <li>Use your actual monthly amounts for accurate representation</li>
            <li>
              Include both fixed expenses (rent, insurance) and variable
              expenses (entertainment, dining out)
            </li>
            <li>Customize colors to group related categories together</li>
            <li>Review and adjust your budget based on the visual insights</li>
          </ul>

          <h3>Common Budget Categories to Consider</h3>

          <ul>
            <li>Housing (rent/mortgage, property taxes, maintenance)</li>
            <li>
              Transportation (car payments, gas, insurance, public transit)
            </li>
            <li>Food (groceries, dining out)</li>
            <li>Utilities (electricity, water, internet, phone)</li>
            <li>Insurance (health, life, disability)</li>
            <li>Savings and investments</li>
            <li>Entertainment and recreation</li>
            <li>Personal care and clothing</li>
            <li>Debt payments</li>
            <li>Emergency fund contributions</li>
          </ul>

          <p>
            Remember, a good budget reflects your values and priorities. Use
            this visualization tool to ensure your spending aligns with what
            matters most to your family&apos;s financial goals.
          </p>
        </article>
      </div>
    </>
  );
}
