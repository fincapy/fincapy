'use client';
import { Circles } from 'react-loader-spinner';

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Circles height="80" width="80" color="#4fa94d" radius="6" />
    </div>
  );
}
