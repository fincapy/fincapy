'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { getReadingTime } from './data';

export default function BlogCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
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
  );
}
