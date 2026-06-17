export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 h-4 w-full ${className}`} />;
}

export function ChatPanelSkeleton() {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 p-5 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="min-h-[320px] p-5 space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-20 w-3/4 rounded-2xl" />
        <Skeleton className="h-16 w-5/6 rounded-2xl" />
      </div>
      <div className="border-t border-white/10 p-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function FileTreeSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-48" />
      <div className="ml-4 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="ml-8 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="ml-4 space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 max-w-xl">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-12 w-32 rounded-2xl" />
    </div>
  );
}
