import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { getSortedPosts, getReadingTime } from './data';
import BlogNavbar from './blogNavbar';
export const metadata = {
  title: 'The Fincapy Blog',
  description:
    'Latest articles and tutorials on personal finance and budgeting.',
  alternates: {
    canonical: 'https://fincapy.com/blog',
  },
  openGraph: {
    title: 'The Fincapy Blog',
    description:
      'Latest articles and tutorials on personal finance and budgeting.',
    canonical: 'https://fincapy.com/blog',
  },
};

export default function BlogPage() {
  // Get posts sorted by date (newest first)
  const sortedPosts = getSortedPosts();

  // Separate out the first as featured
  const [featured, ...others] = sortedPosts;

  return (
    <>
      <BlogNavbar />
      {/* Full width background header with overlaid feature card */}
      <div className="relative w-full">
        {/* Background image container */}
        <div className="w-full h-[100vh] md:h-[90vh] relative font-serif">
          {/* Next.js Image as background */}
          <Image
            src="/blog/blog-background.png"
            alt="Blog background"
            fill
            priority
            className="object-cover z-0"
            quality={85}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 z-10">
            <div className="flex items-center justify-center h-full p-4 pt-4 -mt-8 sm:-mt-0">
              <div className="flex flex-col md:flex-row gap-8 items-center md:mt-0">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt || featured.title}
                  width={600}
                  height={600}
                  className="rounded-3xl w-full md:w-auto max-w-[85vw] md:max-w-[600px]"
                  priority
                />
                <div className="flex flex-col gap-4 max-w-xl">
                  <div className="text-white">
                    <p className="text-sm opacity-80">
                      {format(new Date(featured.date), 'MMMM d, yyyy')} ·{' '}
                      {getReadingTime(featured.content)} min read · By{' '}
                      {featured.author.name}
                    </p>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {featured.title}
                  </h1>

                  <p className="text-white opacity-80 text-base md:text-lg">
                    {featured.subheading}
                  </p>

                  <Link
                    href={`/blog/${featured.slug}`}
                    className="mt-2 px-6 py-3 bg-primary border border-amber-600 text-gray-900 rounded-full font-medium hover:bg-amber-600 transition inline-block w-fit font-sans"
                  >
                    Read Article
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog post cards section */}
      <div className="max-w-[1255px] mx-auto px-4 sm:px-6 py-12 md:py-16 md:-mt-28 font-serif relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Calculator Tool Card */}
          <Link
            href="/blog/how-long-to-save-for-a-house-calculator"
            className="group block h-full"
          >
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl overflow-hidden border-2 border-amber-200 hover:shadow-lg hover:border-amber-300 transition-all h-full flex flex-col">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏠</div>
                  <div className="text-2xl font-bold text-amber-800">
                    Calculator
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full font-sans font-medium">
                    TOOL
                  </span>
                  <span className="text-xs text-amber-700 font-medium">
                    Interactive Calculator
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-amber-700 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                  How Long to Save for a House Calculator
                </h3>
                <p className="mt-3 sm:mt-4 text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 flex-grow">
                  Calculate how long it will take to save for your dream home
                  based on your target monthly mortgage payment. Free
                  interactive tool with real-time calculations.
                </p>
                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-600 group-hover:underline">
                    Use Calculator
                  </span>
                  <div className="flex items-center text-xs text-amber-600">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Free Tool
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Budget Pie Chart Tool Card */}
          <Link
            href="/blog/family-budget-plan-pie-graph"
            className="group block h-full"
          >
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl overflow-hidden border-2 border-green-200 hover:shadow-lg hover:border-green-300 transition-all h-full flex flex-col">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-green-800">
                    Pie Chart
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-sans font-medium">
                    TOOL
                  </span>
                  <span className="text-xs text-green-700 font-medium">
                    Budget Visualizer
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-green-700 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                  Family Budget Plan Pie Chart Generator
                </h3>
                <p className="mt-3 sm:mt-4 text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 flex-grow">
                  Create visual pie charts for your family budget. Enter up to
                  100 categories and see your spending breakdown with colorful,
                  interactive charts.
                </p>
                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600 group-hover:underline">
                    Create Chart
                  </span>
                  <div className="flex items-center text-xs text-green-600">
                    <svg
                      className="w-4 h-4 mr-1"
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
                    Free Tool
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {others.map((post) => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.slug}
              className="group block h-full"
            >
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-300 hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 sm:p-6 flex flex-col flex-grow">
                  <h3 className="text-lg sm:text-xl font-semibold group-hover:text-amber-600 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    {format(new Date(post.date), 'MMM d, yyyy')} ·{' '}
                    {getReadingTime(post.content)} min read
                  </p>
                  <div className="flex items-center mt-3 sm:mt-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 sm:mr-3">
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700">
                      {post.author.name}
                    </span>
                  </div>
                  <p className="mt-3 sm:mt-4 text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 flex-grow">
                    {post.subheading}
                  </p>
                  <div className="mt-4 pt-2">
                    <span className="text-sm font-medium text-amber-600 group-hover:underline">
                      Read more
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
