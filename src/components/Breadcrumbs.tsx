import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Add a safety check for undefined or empty items
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
      <Link 
        href="/" 
        className="text-gray-500 hover:text-blue-500 hover:underline flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        <span>Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          <span className="mx-2">/</span>
          
          {index === items.length - 1 ? (
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {item.label}
            </span>
          ) : (
            <Link 
              href={item.href}
              className="hover:text-blue-500 hover:underline"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
