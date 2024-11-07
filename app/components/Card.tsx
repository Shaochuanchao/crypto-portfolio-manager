interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export default function Card({ title, children, className = '', actions }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {actions}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
} 