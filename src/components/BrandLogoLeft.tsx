export const BrandLogoLeft = () => {
  return (
    <a href="/" aria-label="Home" className="flex items-center gap-2 group">
      <img 
        src="/logo.png"
        alt="Gummy Bloom Logo"
        className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent hidden sm:block">
        Gummy Bloom
      </span>
    </a>
  )
}