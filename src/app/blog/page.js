import Link from 'next/link'
import { format } from 'date-fns'

export const metadata = {
  title: 'Blog – MySite',
  description: 'Latest articles and tutorials.',
}

const posts = [
  {
    slug: 'lorem-ipsum',
    title: 'Lorem Ipsum Dolor Sit Amet',
    summary:
      'An example lorem ipsum article to demonstrate the blog layout and dynamic routing.',
    date: '2023-09-15',
  },
  // → you can add more here later
]

export default function BlogPage() {
  // sort newest first
  const sorted = posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {sorted.map((post) => (
        <article
          key={post.slug}
          className="bg-white rounded-lg shadow hover:shadow-md transition p-6 border border-gray-200"
        >
          <time
            dateTime={post.date}
            className="block text-sm text-gray-500 mb-2"
          >
            {format(new Date(post.date), 'MMMM dd, yyyy')}
          </time>

          <h2 className="text-xl font-semibold text-emerald-600 hover:text-amber-500 transition mb-2">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>

          <p className="text-gray-700">{post.summary}</p>

          <Link
            href={`/blog/${post.slug}`}
            className="mt-4 inline-block text-amber-500 hover:underline"
          >
            Read more →
          </Link>
        </article>
      ))}
    </div>
  )
}
