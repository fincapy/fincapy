import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

export const metadata = {
  title: 'Blog – MySite',
  description: 'Latest articles and tutorials.',
}

// stubbed posts – add more here
const posts = [
  {
    slug: 'lorem-ipsum',
    title: 'Lorem Ipsum Dolor Sit Amet',
    summary:
      'An example lorem ipsum article to demonstrate the blog layout and dynamic routing.',
    date: '2023-09-15',
    image: '/images/blog/lorem-hero.jpg',       // your featured image
    author: {
      name: 'Jane Doe',
      avatar: '/images/authors/jane.jpg',
    },
    content: `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Nullam ac vestibulum eros, vel venenatis neque. Aliquam erat volutpat.
      Phasellus ut elit vel lacus gravida aliquet. Etiam sit amet posuere nulla.
      Integer nec tincidunt nisl.
    `,
  },
  // → you can add more posts here
]

export default function BlogPage() {
  // reverse-chronological
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  // separate out the first as featured
  const [featured, ...others] = sorted
  
  // simple reading time = words / 200 wpm
  const readingTime = (text) =>
    Math.ceil(text.trim().split(/\s+/).length / 200)

  return (
    <div className="space-y-12">
      {/* Featured Hero */}
      <article className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
        <Image
          src={featured.image}
          alt={featured.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6">
          <time
            dateTime={featured.date}
            className="text-sm text-gray-200 mb-2"
          >
            {format(new Date(featured.date), 'MMMM dd, yyyy')}
          </time>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
            <Link href={`/blog/${featured.slug}`}>
              {featured.title}
            </Link>
          </h2>
          <div className="flex items-center space-x-3">
            <Image
              src={featured.author.avatar}
              alt={featured.author.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-sm text-gray-200">
              {featured.author.name} ·{' '}
              {readingTime(featured.content)} min read
            </span>
          </div>
        </div>
      </article>

      {/* Other Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {others.map((post) => (
          <article
            key={post.slug}
            className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden"
          >
            <div className="relative w-full h-40">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <time
                dateTime={post.date}
                className="block text-sm text-gray-500 mb-2"
              >
                {format(new Date(post.date), 'MMMM dd, yyyy')}
              </time>
              <h3 className="text-lg font-semibold text-emerald-600 hover:text-amber-500 mb-2">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="text-gray-700 mb-4">{post.summary}</p>
              <div className="flex items-center space-x-2">
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="text-sm text-gray-500">
                  {post.author.name} · {readingTime(post.content)} min read
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
