import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

// Function to calculate reading time based on content
const calculateReadingTime = (text) => {
  return Math.ceil((text?.trim().split(/\s+/).length || 0) / 200) || 1;
};

export default function FeatureCard({ post }) {
  const {
    slug = 'placeholder',
    title = 'Feature Article Title',
    summary = 'This is a placeholder for the article summary. Replace with actual content.',
    date = new Date().toISOString().split('T')[0],
    image = '/blog/lair.png',
    content = '',
    author = {
      name: 'Author Name',
      avatar: '/goats.png',
    },
  } = post || {};

  const readingTime = calculateReadingTime(content);

  return (
    <Card className="w-full overflow-hidden hover:shadow-xl shadow-sm transition-shadow duration-300 border border-gray-300">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row h-full">
          {/* Hero Image - Left side on desktop, top on mobile */}
          <div className="relative w-full md:w-2/5 h-64 md:h-96">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Content - Right side on desktop, bottom on mobile */}
          <div className="flex flex-col justify-between p-6 md:p-8 md:w-3/5 bg-white">
            <div>
              {/* Date */}
              <time
                dateTime={date}
                className="text-sm text-gray-500 mb-2 block"
              >
                {format(new Date(date), 'MMMM dd, yyyy')}
              </time>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-emerald-600 hover:text-amber-500 transition-colors">
                <Link href={`/blog/${slug}`}>{title}</Link>
              </h2>

              {/* Summary */}
              <p className="text-gray-700 mb-6 line-clamp-3">{summary}</p>
            </div>

            {/* Author and reading time */}
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500">
                <Image
                  src={author.avatar}
                  alt={author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-emerald-600">{author.name}</p>
                <p className="text-sm text-gray-500">{readingTime} min read</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
