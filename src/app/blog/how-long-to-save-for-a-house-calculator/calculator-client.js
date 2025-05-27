'use client';

import { useState } from 'react';
import Link from 'next/link';
import BlogPageNavbar from '../blogPageNavbar';

export default function HouseSavingsCalculatorClient() {
  const [inputs, setInputs] = useState({
    monthlySavings: '',
    downPayment: '',
    housePrice: '',
    targetMonthlyPayment: '',
    startingSavings: '',
    mortgageRate: '',
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    const requiredFields = {
      housePrice: 'House Price',
      targetMonthlyPayment: 'Target Monthly Mortgage Payment',
      monthlySavings: 'Monthly Savings Rate',
      mortgageRate: 'Mortgage Rate',
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!inputs[field] || parseFloat(inputs[field]) <= 0) {
        errors[field] = `${label} is required`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const calculateMonthlyMortgage = (loanAmount, annualRate, years = 30) => {
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = years * 12;

    if (monthlyRate === 0) return loanAmount / totalPayments;

    return (
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
    );
  };

  const calculateSavingsTime = () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const housePrice = parseFloat(inputs.housePrice);
    const targetPayment = parseFloat(inputs.targetMonthlyPayment);
    const monthlySavings = parseFloat(inputs.monthlySavings);
    const startingSavings = parseFloat(inputs.startingSavings) || 0;
    const userMortgageRate = parseFloat(inputs.mortgageRate);

    if (!housePrice || !targetPayment || !monthlySavings || !userMortgageRate) {
      setLoading(false);
      return;
    }

    // Binary search to find the right down payment for target monthly payment
    let minDownPayment = 0;
    let maxDownPayment = housePrice * 0.5; // Max 50% down payment
    let optimalDownPayment = 0;

    for (let i = 0; i < 100; i++) {
      // Max iterations
      const testDownPayment = (minDownPayment + maxDownPayment) / 2;
      const loanAmount = housePrice - testDownPayment;
      const monthlyPayment = calculateMonthlyMortgage(
        loanAmount,
        userMortgageRate
      );

      if (Math.abs(monthlyPayment - targetPayment) < 1) {
        optimalDownPayment = testDownPayment;
        break;
      }

      if (monthlyPayment > targetPayment) {
        minDownPayment = testDownPayment;
      } else {
        maxDownPayment = testDownPayment;
      }
    }

    // Calculate time to save for optimal down payment
    const neededSavings = Math.max(0, optimalDownPayment - startingSavings);
    const monthsToSave = neededSavings / monthlySavings;
    const yearsToSave = monthsToSave / 12;

    // Calculate final loan details
    const finalLoanAmount = housePrice - optimalDownPayment;
    const finalMonthlyPayment = calculateMonthlyMortgage(
      finalLoanAmount,
      userMortgageRate
    );

    setResults({
      optimalDownPayment,
      monthsToSave,
      yearsToSave,
      finalLoanAmount,
      finalMonthlyPayment,
      neededSavings,
    });

    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.floor(months % 12);

    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  return (
    <>
      <BlogPageNavbar />
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-gray-600 font-serif mt-12">
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
            How Long to Save for a House Calculator
          </h1>
          <p className="text-xl text-gray-600 italic mb-6 font-serif">
            Calculate how long it will take to save for your dream home based on
            your target monthly mortgage payment
          </p>
        </div>

        {/* Calculator Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            House Savings Calculator
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                House Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={inputs.housePrice}
                  onChange={(e) =>
                    handleInputChange('housePrice', e.target.value)
                  }
                  className={`pl-8 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    validationErrors.housePrice
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="500,000"
                />
              </div>
              {validationErrors.housePrice && (
                <p className="text-sm text-red-600 mt-1">
                  {validationErrors.housePrice}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Monthly Mortgage Payment *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={inputs.targetMonthlyPayment}
                  onChange={(e) =>
                    handleInputChange('targetMonthlyPayment', e.target.value)
                  }
                  className={`pl-8 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    validationErrors.targetMonthlyPayment
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="2,500"
                />
              </div>
              {validationErrors.targetMonthlyPayment && (
                <p className="text-sm text-red-600 mt-1">
                  {validationErrors.targetMonthlyPayment}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Savings Rate *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={inputs.monthlySavings}
                  onChange={(e) =>
                    handleInputChange('monthlySavings', e.target.value)
                  }
                  className={`pl-8 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    validationErrors.monthlySavings
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="1,500"
                />
              </div>
              {validationErrors.monthlySavings && (
                <p className="text-sm text-red-600 mt-1">
                  {validationErrors.monthlySavings}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Savings
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={inputs.startingSavings}
                  onChange={(e) =>
                    handleInputChange('startingSavings', e.target.value)
                  }
                  className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="10,000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional - leave blank if starting from $0
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mortgage Rate *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={inputs.mortgageRate}
                  onChange={(e) =>
                    handleInputChange('mortgageRate', e.target.value)
                  }
                  className={`pr-8 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    validationErrors.mortgageRate
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="7.0"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
              {validationErrors.mortgageRate && (
                <p className="text-sm text-red-600 mt-1">
                  {validationErrors.mortgageRate}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter your quoted mortgage rate or use current market rates
              </p>
            </div>
          </div>

          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                <span className="font-semibold">
                  Please fill in all required fields:
                </span>
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                {Object.values(validationErrors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={calculateSavingsTime}
            disabled={
              loading ||
              Object.keys(validationErrors).length > 0 ||
              !inputs.housePrice ||
              !inputs.targetMonthlyPayment ||
              !inputs.monthlySavings ||
              !inputs.mortgageRate
            }
            className="w-full bg-amber-500 hover:bg-amber-600 border border-amber-600 disabled:border-none disabled:bg-gray-400 disabled:cursor-not-allowed text-gray-900 py-3 px-4 rounded-md transition-colors duration-200 font-semibold"
          >
            {loading ? 'Calculating...' : 'Calculate Savings Time'}
          </button>

          {/* Results Section */}
          {results && (
            <div className="mt-8 space-y-6">
              {/* Primary Result - Time to Save */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Your Savings Timeline
                </h3>
                <div className="text-4xl font-bold text-green-800 mb-2">
                  {formatTime(results.monthsToSave)}
                </div>
                <p className="text-gray-600">
                  Time needed to reach your target monthly payment of{' '}
                  {formatCurrency(parseFloat(inputs.targetMonthlyPayment))}
                </p>
              </div>

              {/* Additional Details */}
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Calculation Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">
                      Required Down Payment
                    </div>
                    <div className="text-xl font-bold text-amber-800">
                      {formatCurrency(results.optimalDownPayment)}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">
                      Loan Amount
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {formatCurrency(results.finalLoanAmount)}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">
                      Actual Monthly Payment
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {formatCurrency(results.finalMonthlyPayment)}
                    </div>
                  </div>
                </div>

                {results.neededSavings > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900">
                      <span className="font-semibold">
                        Additional savings needed:
                      </span>{' '}
                      {formatCurrency(results.neededSavings)}
                    </p>
                    <p className="text-blue-800 text-sm mt-1">
                      At your current savings rate of{' '}
                      {formatCurrency(parseFloat(inputs.monthlySavings))}/month,
                      you'll reach your goal in{' '}
                      {formatTime(results.monthsToSave)}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Educational Content */}
        <article className="prose prose-lg max-w-none text-black prose-headings:text-gray-900 prose-a:text-amber-800 prose-a:no-underline prose-img:rounded-md prose-h2:text-xl prose-p:font-serif prose-p:leading-relaxed prose-ul:-mt-[16px] prose-li:marker:text-black">
          <h2>Understanding Your Home Savings Journey</h2>

          <p>
            Saving for a house requires careful planning and realistic
            expectations. This calculator helps you understand the relationship
            between your target monthly mortgage payment and the down payment
            required to achieve it.
          </p>

          <h3>Key Factors That Affect Your Timeline</h3>

          <ul>
            <li>
              <strong>Interest Rates:</strong> Current mortgage rates
              significantly impact your monthly payment
            </li>
            <li>
              <strong>Down Payment:</strong> A larger down payment reduces your
              loan amount and monthly payments
            </li>
            <li>
              <strong>Savings Rate:</strong> The more you can save monthly, the
              faster you'll reach your goal
            </li>
            <li>
              <strong>House Price:</strong> Higher priced homes require larger
              down payments for the same monthly payment
            </li>
          </ul>

          <h3>Tips for Faster Saving</h3>

          <ul>
            <li>Automate your savings to ensure consistency</li>
            <li>
              Consider high-yield savings accounts to grow your money faster
            </li>
            <li>Look for ways to increase your income or reduce expenses</li>
            <li>Research first-time homebuyer programs in your area</li>
            <li>
              Keep track of changing interest rates and adjust your strategy
              accordingly
            </li>
          </ul>

          <p>
            Remember, this calculator provides estimates based on current rates
            and standard loan terms. Actual loan terms, rates, and requirements
            may vary based on your credit score, debt-to-income ratio, and other
            factors. Consider consulting with a mortgage professional for
            personalized advice.
          </p>
        </article>
      </div>
    </>
  );
}
