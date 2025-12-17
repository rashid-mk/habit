interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'orbit' | 'wave'
  className?: string
  color?: 'blue' | 'indigo' | 'purple' | 'green' | 'gray'
  label?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  className = '',
  color = 'blue',
  label = 'Loading'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'border-t-blue-600 text-blue-600',
    indigo: 'border-t-indigo-600 text-indigo-600',
    purple: 'border-t-purple-600 text-purple-600',
    green: 'border-t-green-600 text-green-600',
    gray: 'border-t-gray-600 text-gray-600'
  }

  const bgColorClasses = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    gray: 'bg-gray-600'
  }

  if (variant === 'spinner') {
    return (
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 ${colorClasses[color]} ${sizeClasses[size]} ${className} transition-all duration-300`}
        role="status"
        aria-label={label}
      >
        <span className="sr-only">{label}...</span>
      </div>
    )
  }

  if (variant === 'orbit') {
    const orbitSize = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : size === 'lg' ? 'w-16 h-16' : 'w-20 h-20'
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
    
    return (
      <div className={`relative ${orbitSize} ${className}`} role="status" aria-label={label}>
        <div className="absolute inset-0 animate-spin">
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 ${dotSize} ${bgColorClasses[color]} rounded-full`} />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.5s', animationDirection: 'reverse' }}>
          <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 ${dotSize} ${bgColorClasses[color]} rounded-full opacity-60`} />
        </div>
        <span className="sr-only">{label}...</span>
      </div>
    )
  }

  if (variant === 'wave') {
    const barHeight = size === 'sm' ? 'h-4' : size === 'md' ? 'h-6' : size === 'lg' ? 'h-8' : 'h-10'
    const barWidth = size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : size === 'lg' ? 'w-2' : 'w-3'
    
    return (
      <div className={`flex items-end space-x-1 ${className}`} role="status" aria-label={label}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`${barWidth} ${barHeight} ${bgColorClasses[color]} animate-pulse`}
            style={{ 
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s',
              transformOrigin: 'bottom'
            }}
          />
        ))}
        <span className="sr-only">{label}...</span>
      </div>
    )
  }

  if (variant === 'dots') {
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-5 h-5'
    return (
      <div className={`flex space-x-2 ${className}`} role="status" aria-label={label}>
        <div className={`${dotSize} ${bgColorClasses[color]} rounded-full animate-loadingDots`} />
        <div className={`${dotSize} ${bgColorClasses[color]} rounded-full animate-loadingDots`} />
        <div className={`${dotSize} ${bgColorClasses[color]} rounded-full animate-loadingDots`} />
        <span className="sr-only">{label}...</span>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div 
        className={`rounded-full ${bgColorClasses[color]} animate-pulse ${sizeClasses[size]} ${className} transition-all duration-300`}
        role="status"
        aria-label={label}
      >
        <span className="sr-only">{label}...</span>
      </div>
    )
  }

  if (variant === 'bars') {
    const barHeight = size === 'sm' ? 'h-4' : size === 'md' ? 'h-6' : size === 'lg' ? 'h-8' : 'h-10'
    const barWidth = size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : size === 'lg' ? 'w-2' : 'w-3'
    
    return (
      <div className={`flex items-end space-x-1 ${className}`} role="status" aria-label={label}>
        <div className={`${barWidth} ${barHeight} ${bgColorClasses[color]} animate-pulse`} style={{ animationDelay: '0ms' }} />
        <div className={`${barWidth} ${barHeight} ${bgColorClasses[color]} animate-pulse`} style={{ animationDelay: '100ms' }} />
        <div className={`${barWidth} ${barHeight} ${bgColorClasses[color]} animate-pulse`} style={{ animationDelay: '200ms' }} />
        <div className={`${barWidth} ${barHeight} ${bgColorClasses[color]} animate-pulse`} style={{ animationDelay: '300ms' }} />
        <span className="sr-only">{label}...</span>
      </div>
    )
  }

  return null
}
