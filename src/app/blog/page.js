import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import FeatureCard from './featureCard';

export const metadata = {
  title: 'Blog – MySite',
  description: 'Latest articles and tutorials.',
};

// stubbed posts – add more here
const posts = [
  {
    slug: 'lorem-ipsum',
    title: 'Lorem Ipsum Dolor Sit Amet',
    summary:
      'An example lorem ipsum article to demonstrate the blog layout and dynamic routing.',
    date: '2023-09-15',
    image: '/blog/lair.png', // your featured image
    author: {
      name: 'Jane Doe',
      avatar: '/goats.png',
    },
    content: `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Nullam ac vestibulum eros, vel venenatis neque. Aliquam erat volutpat.
      Phasellus ut elit vel lacus gravida aliquet. Etiam sit amet posuere nulla.
      Integer nec tincidunt nisl.
    `,
  },
  // → you can add more posts here
];

export default function BlogPage() {
  // reverse-chronological
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // separate out the first as featured
  const [featured, ...others] = sorted;

  // simple reading time = words / 200 wpm
  const readingTime = (text) =>
    Math.ceil(text.trim().split(/\s+/).length / 200);

  return (
    <>
      {/* Full width background header with overlaid feature card */}
      <div className="relative">
        {/* Background image */}
        <div
          className="w-full h-[90vh] bg-cover bg-center relative"
          style={{ backgroundImage: 'url(/blog/blog-background.png)' }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50">
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-row gap-8 items-center">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  width={600}
                  height={600}
                  className="rounded-3xl"
                />
                <div className="flex flex-col gap-4 max-w-xl">
                  <div className="text-white">
                    <p className="text-sm opacity-80">
                      {format(new Date(featured.date), 'MMMM d, yyyy')} ·{' '}
                      {readingTime(featured.content)} min read · By{' '}
                      {featured.author.name}
                    </p>
                  </div>

                  <h1 className="text-4xl font-bold text-white">
                    Why I Built (another) Budgeting App
                  </h1>

                  <p className="text-white opacity-80 text-lg">
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
    </>
  );
}
