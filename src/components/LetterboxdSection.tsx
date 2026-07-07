import { motion } from 'framer-motion';

export function LetterboxdSection() {
  const films = [
    { title: "Beautiful Boy", year: 2018, poster: "https://image.tmdb.org/t/p/w500/j5w82t5cO4b1o5V2D3V5h2c5b7K.jpg" },
    { title: "The Perks of Being a Wallflower", year: 2012, poster: "https://image.tmdb.org/t/p/w500/a1cO4mAENiMAMWJ96i21X60bI5s.jpg" },
    { title: "Good Will Hunting", year: 1997, poster: "https://image.tmdb.org/t/p/w500/bSqt9rhDZx1Q7UZ86dBPKdNomp2.jpg" },
    { title: "Dil Bechara", year: 2020, poster: "https://image.tmdb.org/t/p/w500/pxzQIGiIfP8w4aF8P34N8PebXQ8.jpg" },
  ];

  return (
    <section className="relative w-full min-h-screen bg-[#050509] overflow-hidden flex flex-col items-center justify-center border-t border-white/10 py-24 px-6">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-20 text-center mb-16 relative">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-4 opacity-90 text-white">
          Letterboxd
        </h2>
        <a 
          href="https://letterboxd.com/parihar21/" 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-2 text-xs md:text-sm text-[#00E054] font-mono tracking-widest uppercase hover:text-[#40ff86] transition-colors bg-[#00E054]/10 px-4 py-2 rounded-full border border-[#00E054]/20"
        >
          @parihar21
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <p className="mt-8 text-sm text-gray-400 font-mono uppercase tracking-widest">Favorite Films</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto z-20 w-full">
        {films.map((film, index) => (
          <motion.div
            key={film.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: index * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 hover:border-white/30 transition-colors bg-white/5"
          >
            {/* Fallback color/gradient if image doesn't load immediately */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0" />
            
            <img 
              src={film.poster} 
              alt={film.title} 
              className="w-full h-full object-cover relative z-10 transition-transform duration-1000 group-hover:scale-110" 
              onError={(e) => {
                // Hide broken image if url is invalid
                e.currentTarget.style.opacity = '0';
              }}
            />
            
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
            
            <div className="absolute inset-0 z-30 flex flex-col justify-end p-5 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-white text-base md:text-lg font-bold leading-tight mb-1">{film.title}</h3>
              <span className="text-[#00E054] font-mono text-xs tracking-widest">{film.year}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
