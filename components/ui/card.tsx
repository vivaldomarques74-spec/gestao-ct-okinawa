export function Card({ children, className = "" }: any) {
  return (
    <div className={`rounded-2xl shadow-md ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = "" }: any) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}