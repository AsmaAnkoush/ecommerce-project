export default function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div
      className={`${sizes[size]} rounded-full animate-spin`}
      style={{
        border: '2px solid #F0D5D8',
        borderTopColor: '#6B1F2A',
        borderRightColor: '#DFA3AD',
      }}
    />
  )
}
