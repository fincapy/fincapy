import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { getSortedPosts, getReadingTime } from './data';

export const metadata = {
  title: 'Blog – Fincapy',
  description:
    'Latest articles and tutorials on personal finance and budgeting.',
};

export default function BlogPage() {
  // Get posts sorted by date (newest first)
  const sortedPosts = getSortedPosts();

  // Separate out the first as featured
  const [featured, ...others] = sortedPosts;

  return (
    <>
      {/* Full width background header with overlaid feature card */}
      <div className="relative w-full">
        {/* Background image */}
        <div
          className="w-full h-[100vh] md:h-[90vh] bg-cover bg-center relative"
          style={{ backgroundImage: 'url(/blog/blog-background.png)' }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50">
            <div className="flex items-center justify-center h-full p-4 pt-4">
              <div className="flex flex-col md:flex-row gap-8 items-center mt-8 md:mt-0">
                <Image
                  src={featured.image}
                  alt={featured.title}
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
                    {featured.summary}
                  </p>

                  <Link
                    href={`/blog/${featured.slug}`}
                    className="mt-2 px-6 py-3 bg-primary border border-amber-600 text-gray-900 rounded-full font-medium hover:bg-amber-600 transition inline-block w-fit"
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
      <div className="max-w-[1255px] mx-auto px-4 sm:px-6 py-12 md:py-16 md:-mt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                    alt={post.title}
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
                    {post.summary}
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
