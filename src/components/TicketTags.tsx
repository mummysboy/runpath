'use client';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TicketTagsProps {
  tags: Tag[];
  size?: 'sm' | 'md';
}

export default function TicketTags({ tags, size = 'sm' }: TicketTagsProps) {
  if (!tags || tags.length === 0) return null;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(tag => (
        <span
          key={tag.id}
          className={`${sizeClasses} rounded-full font-medium`}
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
          }}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
