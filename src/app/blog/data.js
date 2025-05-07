// Blog post data that can be shared across components
export const blogPosts = [
  {
    slug: 'why-i-built-another-budgeting-app',
    title: 'Why I Built (another) Budgeting App',
    summary:
      'The story behind Fincapy and why I decided to create yet another personal finance tool in an already crowded market.',
    date: '2023-10-15',
    image: '/blog/lair.png',
    author: {
      name: 'Jane Doe',
      avatar: '/goats.png',
    },
    content: `
      <p>When I first started thinking about building a personal finance app, I asked myself the same question you're probably thinking: "Does the world really need another budgeting app?"</p>
      
      <p>The short answer is: probably not. But the longer answer is what led me to create Fincapy anyway.</p>
      
      <h2>The Problem with Existing Solutions</h2>
      
      <p>I've tried them all - Mint, YNAB, Personal Capital, and countless others. Each has its strengths, but I found myself constantly switching between apps or maintaining spreadsheets alongside them.</p>
      
      <p>Most existing tools excel at tracking what has already happened with your money, but few are truly helpful at planning for the future in a flexible way that adapts to real life.</p>
      
      <h2>The Vision for Fincapy</h2>
      
      <p>Fincapy started as a personal project to solve my own frustrations. I wanted:</p>
      
      <ul>
        <li>A tool that combines historical tracking with future planning</li>
        <li>Flexible budgeting that doesn't make me feel guilty when life happens</li>
        <li>Simple visualizations that actually help me make decisions</li>
        <li>Privacy-first design where my financial data isn't the product</li>
      </ul>
      
      <p>What began as a personal project has evolved into something I believe can help others too. Fincapy isn't trying to be everything for everyone - it's built specifically for people who want to be intentional about their finances without becoming obsessive.</p>
      
      <h2>What's Next</h2>
      
      <p>We're just getting started. The initial version focuses on the core experience, but I have a roadmap full of features I'm excited to build based on early feedback.</p>
      
      <p>If you're interested in joining the journey, sign up for the waitlist and be among the first to try Fincapy when it launches.</p>
    `,
  },
  {
    slug: 'getting-started-with-personal-finance',
    title: 'Getting Started with Personal Finance',
    summary:
      'Learn the basics of personal finance and how to start managing your money effectively.',
    date: '2023-08-20',
    image: '/blog/lair.png',
    author: {
      name: 'John Smith',
      avatar: '/goats.png',
    },
    content: `
      <p>Getting started with personal finance can seem overwhelming, but it doesn't have to be. This guide will help you understand the basics and set you on the path to financial success.</p>
      
      <h2>1. Track Your Spending</h2>
      
      <p>The first step to managing your finances is understanding where your money goes. Start by tracking all your expenses for a month. You might be surprised at what you discover!</p>
      
      <h2>2. Create a Budget</h2>
      
      <p>Once you know your spending patterns, create a simple budget that allocates your income to different categories. Remember, a budget isn't meant to restrict you—it's a plan for your money.</p>
      
      <h2>3. Build an Emergency Fund</h2>
      
      <p>Before focusing on other financial goals, aim to save 3-6 months of essential expenses in an easily accessible account. This provides peace of mind and financial stability.</p>
      
      <h2>4. Tackle High-Interest Debt</h2>
      
      <p>If you have credit card debt or other high-interest loans, prioritize paying these down. The interest you save is often better than returns you might get from investing.</p>
      
      <h2>5. Start Investing Early</h2>
      
      <p>Even small amounts invested regularly can grow significantly over time thanks to compound interest. Consider retirement accounts like a 401(k) or IRA to get started.</p>
      
      <p>Remember, personal finance is personal. What works for someone else might not work for you. The key is to start somewhere and make adjustments as you learn more about your financial habits and goals.</p>
    `,
  },
  {
    slug: 'understanding-credit-scores',
    title: 'Understanding Credit Scores',
    summary:
      'Everything you need to know about credit scores and how they impact your financial health.',
    date: '2023-07-15',
    image: '/blog/lair.png',
    author: {
      name: 'Sarah Johnson',
      avatar: '/goats.png',
    },
    content: `
      <p>Your credit score is a crucial part of your financial identity. This article explains what credit scores are, how they're calculated, and why they matter.</p>
      
      <h2>What Is a Credit Score?</h2>
      
      <p>A credit score is a three-digit number that represents your creditworthiness. Lenders use this score to determine whether to approve you for loans and what interest rates to offer you.</p>
      
      <h2>How Credit Scores Are Calculated</h2>
      
      <p>The most common credit scoring model is FICO, which considers five main factors:</p>
      
      <ul>
        <li><strong>Payment History (35%)</strong>: Whether you've paid past credit accounts on time</li>
        <li><strong>Amounts Owed (30%)</strong>: How much debt you have and how much of your available credit you're using</li>
        <li><strong>Length of Credit History (15%)</strong>: How long you've been using credit</li>
        <li><strong>New Credit (10%)</strong>: Recently opened accounts and credit inquiries</li>
        <li><strong>Credit Mix (10%)</strong>: The variety of credit accounts you have</li>
      </ul>
      
      <h2>Why Your Credit Score Matters</h2>
      
      <p>Your credit score affects more than just loan approvals. It can impact:</p>
      
      <ul>
        <li>Interest rates on loans and credit cards</li>
        <li>Insurance premiums</li>
        <li>Rental applications</li>
        <li>Employment opportunities (in some states)</li>
        <li>Utility deposits</li>
      </ul>
      
      <h2>How to Improve Your Credit Score</h2>
      
      <p>Improving your credit score takes time, but these strategies can help:</p>
      
      <ul>
        <li>Pay all bills on time</li>
        <li>Keep credit card balances low</li>
        <li>Don't close old credit accounts</li>
        <li>Limit applications for new credit</li>
        <li>Regularly check your credit report for errors</li>
      </ul>
      
      <p>Remember that building good credit is a marathon, not a sprint. Consistent, responsible financial habits over time will lead to a strong credit score.</p>
    `,
  },
  {
    slug: 'budgeting-101',
    title: 'Budgeting 101: Creating Your First Budget',
    summary:
      'A step-by-step guide to creating and sticking to your first budget.',
    date: '2023-06-10',
    image: '/blog/lair.png',
    author: {
      name: 'Michael Brown',
      avatar: '/goats.png',
    },
    content: `
      <p>Creating a budget is the foundation of good financial health. This guide will walk you through the process of setting up a budget that works for you.</p>
      
      <h2>Step 1: Calculate Your Income</h2>
      
      <p>Start by determining your total monthly income after taxes. Include all sources of income: your primary job, side hustles, rental income, etc.</p>
      
      <h2>Step 2: Track Your Expenses</h2>
      
      <p>Before creating categories, track your spending for a month to see where your money actually goes. Group expenses into categories like:</p>
      
      <ul>
        <li>Housing (rent/mortgage, utilities, maintenance)</li>
        <li>Transportation (car payment, gas, public transit)</li>
        <li>Food (groceries, dining out)</li>
        <li>Insurance (health, auto, home)</li>
        <li>Debt payments (student loans, credit cards)</li>
        <li>Savings and investments</li>
        <li>Entertainment and discretionary spending</li>
      </ul>
      
      <h2>Step 3: Set Realistic Goals</h2>
      
      <p>Based on your income and necessary expenses, set realistic goals for discretionary spending and savings. The 50/30/20 rule is a good starting point:</p>
      
      <ul>
        <li>50% for needs (housing, food, transportation)</li>
        <li>30% for wants (entertainment, dining out)</li>
        <li>20% for savings and debt repayment</li>
      </ul>
      
      <h2>Step 4: Choose a Budgeting Method</h2>
      
      <p>Several budgeting methods exist, including:</p>
      
      <ul>
        <li><strong>Zero-based budgeting</strong>: Every dollar has a job</li>
        <li><strong>Envelope system</strong>: Cash in envelopes for different categories</li>
        <li><strong>Pay yourself first</strong>: Prioritize savings, then spend the rest</li>
      </ul>
      
      <h2>Step 5: Review and Adjust Regularly</h2>
      
      <p>A budget isn't set in stone. Review it monthly and make adjustments as needed. Life changes, and your budget should too.</p>
      
      <p>Remember, the best budget is one you can actually stick to. Be realistic, give yourself grace when you make mistakes, and celebrate your financial wins along the way.</p>
    `,
  },
];

// Helper function to get reading time
export function getReadingTime(text) {
  return Math.ceil(text.trim().split(/\s+/).length / 200);
}

// Get all posts sorted by date (newest first)
export function getSortedPosts() {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Get a single post by slug
export function getPostBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug);
}

// Get all post slugs (for static generation)
export function getAllSlugs() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}
