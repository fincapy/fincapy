import { notFound } from 'next/navigation'
import { format } from 'date-fns'

const posts = [
  {
    slug: 'lorem-ipsum',
    title: 'Lorem Ipsum Dolor Sit Amet',
    content: `
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac vestibulum eros, vel venenatis neque. Aliquam erat volutpat.</p>
      <p>Phasellus ut elit vel lacus gravida aliquet. Etiam sit amet posuere nulla. Integer nec tincidunt nisl.</p>
    `,
    date: '2023-09-15',
  },
]

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export default function PostPage({ params: { slug } }) {
  const post = posts.find((p) => p.slug === slug)
  if (!post) return notFound()

  return (
    <article className="prose lg:prose-xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-emerald-600 mb-4">
        {post.title}
      </h1>
      <time
        dateTime={post.date}
        className="block text-sm text-gray-500 mb-8"
      >
        {format(new Date(post.date), 'MMMM dd, yyyy')}
      </time>
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  )
}
