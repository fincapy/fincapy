import { notFound } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from 'next/link';
import { getAllSlugs, getPostBySlug, getReadingTime } from '../data';
import BlogPageNavbar from '../blogPageNavbar';
// Generate static params for all blog posts
export function generateStaticParams() {
  return getAllSlugs();
}

// Generate metadata for each blog post
export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const post = getPostBySlug(awaitedParams.slug);

  if (!post) {
    return {
      title: 'Post Not Found - Fincapy',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: `${post.title} - Fincapy Blog`,
    description: post.subheading,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: post.title,
      description: post.subheading,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    canonical: `https://fincapy.com/blog/${awaitedParams.slug}`,
  };
}

export default function PostPage({ params: { slug } }) {
  const post = getPostBySlug(slug);

  if (!post) return notFound();

  return (
    <>
      <BlogPageNavbar />
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-gray-600 font-serif mt-12">
        <Link
          href="/blog"
          className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-6"
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

        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            {post.title}
          </h1>

          {post.subheading && (
            <p className="text-xl text-gray-600 italic mb-4 font-serif">
              {post.subheading}
            </p>
          )}

          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-gray-800">{post.author.name}</p>
              <div className="text-sm text-gray-500">
                {format(new Date(post.date), 'MMMM d, yyyy')} ·{' '}
                {getReadingTime(post.content)} min read
              </div>
            </div>
          </div>

          {post.image && (
            <div className="relative aspect-[16/9]">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>
          )}
        </div>

        <article
          className="prose prose-lg max-w-none text-gray-800 prose-headings:text-gray-900 prose-a:text-amber-600 prose-img:rounded-md prose-h2:text-xl prose-p:font-serif prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </>
  );
}
