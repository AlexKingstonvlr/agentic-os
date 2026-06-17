import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center max-w-sm w-full">
        <span className="text-5xl">{icon}</span>
        <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
        )}
        {action && (
          <div className="mt-6">
            {action.href ? (
              <Link
                href={action.href}
                className="inline-block rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-black"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-black"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
