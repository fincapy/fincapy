// Blog post data that can be shared across components
export const blogPosts = [
  {
    slug: 'a-budgeting-app-for-avoiders-like-me',
    title: 'A Budgeting App for Avoiders Like Me',
    subheading: 'Building something I could stand to look at',
    date: '2025-05-07',
    image: '/blog/lair.png',
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
