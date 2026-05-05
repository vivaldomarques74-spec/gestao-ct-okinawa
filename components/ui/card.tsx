export function Card({ children, className = "" }: any) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = "" }: any) {
  return <div className={className}>{children}</div>
}