import { Skeleton } from './skeleton';

// Simple test skeleton to debug visibility
export const TestSkeleton = () => (
  <div className="flex flex-col gap-4 p-8">
    <div className="text-lg font-bold">SKELETON LOADING TEST</div>
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-32" />
    <div className="p-4 bg-red-500 text-white">
      This should be visible as red background
    </div>
  </div>
);

export const SpendingSkeleton = () => (
  <div className="flex flex-col w-full flex-grow gap-4 mb-2">
    <div className="flex flex-col justify-center items-center gap-2">
      <div className="flex flex-row justify-between gap-4 w-[95%] lg:max-w-[1152.5px]">
        <div className="flex flex-row flex-wrap gap-2 items-center">
          <Skeleton className="h-9 w-[135px] bg-gray-300" />
          <Skeleton className="h-9 w-[135px] bg-gray-300" />
        </div>
        <Skeleton className="h-9 w-9 bg-gray-300" />
      </div>
      <div className="w-[95%] lg:max-w-[1152.5px] space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[114.73px] w-full bg-gray-300 rounded-xl"
          />
        ))}
      </div>
    </div>
  </div>
);

export const IncomeSkeleton = () => (
  <div className="flex flex-col w-full flex-grow gap-4 mb-2">
    <div className="flex flex-col justify-center items-center gap-2">
      <div className="flex flex-row justify-between gap-4 w-[95%] lg:max-w-[1152.5px]">
        <div className="flex flex-row flex-wrap gap-2 items-center">
          <Skeleton className="h-9 w-[135px] bg-gray-300" />
          <Skeleton className="h-9 w-[135px] bg-gray-300" />
        </div>
        <Skeleton className="h-9 w-9 bg-gray-300" />
      </div>
      <div className="w-[95%] lg:max-w-[1152.5px] space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[114.73px] w-full bg-gray-300 rounded-xl"
          />
        ))}
      </div>
    </div>
  </div>
);

export const SavingsSkeleton = () => (
  <div className="flex flex-col w-full flex-grow gap-4 mb-2">
    <div className="flex flex-col justify-center items-center gap-2">
      <div className="flex flex-row justify-between gap-4 w-[95%] lg:max-w-[1152.5px]">
        <div className="flex flex-row flex-wrap gap-2 items-center">
          <Skeleton className="h-9 w-[135px] bg-gray-300" />
          <Skeleton className="h-9 w-[135px] bg-gray-300" />
        </div>
      </div>
      <div className="w-[95%] lg:max-w-[1152.5px] space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[114.73px] w-full bg-gray-300 rounded-xl"
          />
        ))}
      </div>
    </div>
  </div>
);

export const TransactionsSkeleton = () => (
  <div className="flex flex-col w-full flex-grow gap-4 mb-2">
    <div className="flex flex-col justify-center items-center gap-2">
      <div className="flex flex-row justify-between gap-4 w-[95%] lg:max-w-[1152.5px]">
        <div className="flex flex-row flex-wrap gap-2 items-center">
          <Skeleton className="h-9 w-[135px] bg-gray-300" />
          <Skeleton className="h-9 w-[135px] bg-gray-300" />
        </div>
        <Skeleton className="h-9 w-9 bg-gray-300" />
      </div>
      <Skeleton className="h-[70vh] w-[95%] lg:max-w-[1152.5px] bg-gray-300" />
    </div>
  </div>
);

export const FinancialInstitutionsSkeleton = () => (
  <div className="flex w-full flex-col h-full">
    <div className="max-w-6xl w-[95%] mx-auto relative">
      <div className="flex flex-col items-center justify-center mb-2">
        <Skeleton className="h-12 w-12 rounded-full mb-2 bg-gray-300" />
        <Skeleton className="h-8 w-64 mb-1 bg-gray-300" />
        <Skeleton className="h-4 w-96 bg-gray-300" />
      </div>
      <div className="bg-card rounded-xl border border-border p-6 shadow-md mt-6 w-full mb-2">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-8 w-8 bg-gray-300" />
          <Skeleton className="h-6 w-40 bg-gray-300" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              className="h-40 w-full rounded-xl border border-border bg-gray-300"
              key={index}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ManageUsersSkeleton = () => (
  <div className="flex flex-col w-full flex-grow gap-4 items-center">
    <div className="w-[95%] flex flex-row justify-end">
      <Skeleton className="h-9 w-9 bg-gray-300" />
    </div>
    <div className="w-full">
      <Skeleton className="h-[70vh] bg-gray-300" />
    </div>
  </div>
);

export const AccountSkeleton = () => (
  <div className="flex flex-col w-full flex-grow gap-4 items-center">
    <div className="w-[95%] max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full bg-gray-300" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-gray-300" />
          <Skeleton className="h-4 w-32 bg-gray-300" />
        </div>
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-8 w-8 bg-gray-300" />
              <Skeleton className="h-6 w-40 bg-gray-300" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-gray-300" />
              <Skeleton className="h-4 w-3/4 bg-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
