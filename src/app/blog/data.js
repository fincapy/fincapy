// Blog post data that can be shared across components
export const blogPosts = [
  {
    slug: 'conscious-spending-plan',
    title: "Why I love Ramit Sethi's Conscious Spending Plan",
    subheading: 'The best way to manage your money',
    date: '2025-05-23',
    image: '/blog/conscious-spending-river.png',
    imageAlt:
      'Capyman mindfully meditating on a raging river about his finances',
    author: {
      name: 'Ryan Wible',
      avatar: '/goats.png',
    },
    content: `
      <p>I&apos;m not the best budgeter. I&apos;m <a href="/blog/a-budgeting-app-for-avoiders-like-me">a bit of an avoider</a>. I don&apos;t want to look at where I&apos;m spending my money. If my bank balance is going up, that&apos;s probably good enough, no need to look too closely. Thankfully, I have a framework I love that&apos;s helping me de-stress my finances: <a href="https://www.iwillteachyoutoberich.com/conscious-spending-basics/">Ramit Sethi&apos;s conscious spending plan</a>.</p>

      <p>It&apos;s a thing of beauty, weaving together psychology and sound financial practices. It&apos;s simple at its core. You allocate percentages of spending to different parts of your take home income each month. Standard stuff that we&apos;ve all seen before, like the 50, 30, 20 plan.</p>

      <p>Here&apos;s how he breaks it down:</p>
      <ul>
        <li>50-60% fixed costs (things you know are coming each month. Mortgage, insurance, etc.)</li>
        <li>10% investments</li>
        <li>5-10% savings</li>
        <li>20-35% guilt free spending (that&apos;s right, guilt free)</li>
      </ul>

      <p>Magic. But isn&apos;t this just a repackaging of old ideas? Of course it is! But all great insights are. The magic of the conscious spending plan is the way that it plays on psychology while offering long term financial stability. Notice how there are no indictments in the plan and &quot;guilt free&quot; is emphasized. The plan is not, &quot;save as much as you can until you die.&quot;</p>

      <p>The 10% towards investments shows the plan&apos;s elegance. When I look at 10%, it seems like a low amount for investing for the future, but let&apos;s run the numbers.</p>

      <p>Here are our inputs:
      <ul>
        <li>$100,000 annual income</li>
        <li>$80,000 take home pay</li>
        <li>$8,000 a year investment contribution</li>
        <li>7% annual rate of return (a conservative estimate that factors in inflation and market averages and gives you your future net worth in today&apos;s dollars)</li>
        <li>35 years until retirement</li>
      </ul>
      </p>

      <p>And, via our handy compound interest calculator, the output:</p>
      <ul>
        <li>$1.16 million net worth</li>
      </ul>

      <p>That&apos;s pretty cool. But how does that translate into monthly payments? If we pull from our investments at a rate of 4% a year, that gives us an annual income of $46,400. But wait, that&apos;s not as much as the $100,000 a year that I was making!</p>

      <p>Sure, you can invest more aggressively. But you also have to account for other factors. You won&apos;t be saving as aggressively in retirement. You won&apos;t be investing in retirement. Your fixed costs per month will most likely be lower (maybe you own a house or you downsize your rental). You might get social security income each month. And as your income grows, so will that 10%. You won&apos;t be stuck investing $8,000 a year forever, the rule flexes with you.</p>

      <p>With all of these baked in, your net worth starts to look better and be closer to your current standard of living. That&apos;s why I like the 10% rule. It bakes in all of these factors and gives me peace of mind that I&apos;m taking steps to secure my future without me having to get into the nitty gritty and stress about whether I&apos;m investing enough. I can take a deep breath. It is enough. I&apos;m going to be OK in the future. I won&apos;t be destitute.</p>

      <p>There&apos;s a recurring fear in my life. That I won&apos;t have enough. Or that I won&apos;t be enough. It&apos;s been a constant. Frameworks like this take some of the edge off for me. I know that if I&apos;m following a good framework then my efforts will be enough. And if I die before I see the fruits of my labor pay off, well then I&apos;ve had that guilt free spending all this time to enjoy my life while it&apos;s happening. That&apos;s the beauty of the conscious spending plan.</p>

      <p>The plan is absurdly reasonable, and as we know from <a href="https://www.amazon.com/Psychology-Money-Timeless-lessons-happiness/dp/0857197681">The Psychology of Money</a>, the goal of personal finances is not to be perfect, it&apos;s to be reasonable. What helps you sleep at night? That&apos;s the goal. To, as Ramit puts it, live a rich life. But not just anyone&apos;s rich life. Your particular rich life.</p>

      <p>The guilt free spending prioritizes the fact that life is short. There is a real certainty of death in our world. I don&apos;t know how long I have to enjoy my life, spend time with my wife, do amazing things. Nobody does. I want to live my life to the fullest now and enjoy what comes. I want to be able to spend money on the things that bring joy to my life (for me, mostly food and travel). The guilt free spending line item lets me do that, while also keeping me in line to look after future me. The framework provides me with guardrails to balance my future life with my present one.</p>

      <p>Plans like this keep me sane when my anxiety is running rampant. I can treat it like a process to follow. As long as I&apos;m following these steps, then I know that I&apos;ll be alright when I&apos;m 65 and about to retire. I will have the assets I need to live. I&apos;ll get to live the life that I want in the future. And, I get to live the rich life that I want right now. Thanks Ramit.</p>
    `,
  },
  {
    slug: 'a-budgeting-app-for-avoiders-like-me',
    title: 'A Budgeting App for Avoiders Like Me',
    subheading: 'Building something I could stand to look at',
    date: '2025-05-07',
    image: '/blog/lair.png',
    imageAlt:
      'Capyman building fincapy on a computer inside of his capybara suitable lair',
    author: {
      name: 'Ryan Wible',
      avatar: '/goats.png',
    },
    content: `
      <p>I&apos;m not a great budgeter. I&apos;m an avoider. I&apos;ll happily distract myself from the essential logistics of my life and rationalize it later. Like this app. I&apos;ve spent countless hours tuning the interface for other people to look at their budgets. But when I pull up my own, there&apos;s a part of me that recoils.</p>

      <p>It&apos;s exhilarating to experience the daily utility of something I&apos;ve built. But to see my own finances laid bare is uncomfortable. I don&apos;t like seeing how much I spent on groceries. I don&apos;t like seeing that drink I bought that cost nine dollars. The light, it burns.</p>

      <p>I built Fincapy to be as shame-free as possible so that I can look at my money and let the numbers speak for themselves. The good news is that I only have to look at them every once in a while. I&apos;m not someone who runs their spreadsheets every weekend and keeps a tight rein on everything. God bless those people, I&apos;m glad they&apos;re out there.</p>

      <p>For instance, I&apos;ve found recently that I spend a lot of money on Amazon. On what? On… Amazon stuff. I don&apos;t know. What, you expect me to track all of it? Who has time for that? Turns out I need an Amazon category. If I spend a certain amount on Amazon every month, that&apos;s all right with me. But go above that too often, and things get dicey.</p>

      <p>Thankfully, I&apos;m blessed enough that if I make a mistake with my money in the short term, it won&apos;t affect me too badly in the long term. I have time to learn and grow with my finances. I know that the daily practice of humility is what counts. But it&apos;s also the daily practice of joy. I love my coffee in the morning. I&apos;m not going to stop buying it. I love walking for ice cream with my wife. Not going to stop that either.</p>

      <p>I built the app because I wanted something that would force me to engage with my finances just enough so that I could grow with them. All it has to do is keep me on the right track. Overspending by a few dollars? Acceptable. Overspending by a few hundred dollars? Well, there might be something I need to address.</p>

      <p>I&apos;m not a great budgeter, but I suspect that some of you aren&apos;t either. This is a safe place for you. I want this to be a community of people dedicated to growing with their money together. I hope that Fincapy will support you on your journey to live with your money, not fight it.</p>
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
