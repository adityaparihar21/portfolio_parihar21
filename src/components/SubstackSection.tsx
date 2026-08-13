import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, BookOpen, Quote, RefreshCw } from "lucide-react";

interface SubstackPost {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  date: string;
  bgImage?: string;
  url: string;
}

// Initial curated fallback posts snapshot for instant render
const FALLBACK_POSTS: SubstackPost[] = [
  {
    id: "hurry-makes-us-late",
    title: "The Hurry That Makes Us Late",
    subtitle: "There are two ways to be late.",
    category: "Reflections & Time",
    readTime: "4 min read",
    date: "Aug 13, 2026",
    bgImage: "https://substackcdn.com/image/fetch/$s_!URZC!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F9b63d861-2155-4f17-b240-3779e44cda75_1672x941.heic",
    url: "https://wiseralph21.substack.com/p/the-hurry-that-makes-us-late",
  },
  {
    id: "hollow-after-high",
    title: "THE HOLLOW AFTER THE HIGH",
    subtitle: "- post event thoughts",
    category: "Reflections & Focus",
    readTime: "4 min read",
    date: "Jul 12, 2026",
    bgImage: "https://substack-post-media.s3.amazonaws.com/public/images/ace826bd-59b6-471c-a61b-324cdece949e_1600x900.jpeg",
    url: "https://wiseralph21.substack.com/p/the-hollow-after-the-high",
  },
  {
    id: "development-damage",
    title: "Development Has an Address. So Does the Damage.",
    subtitle: "last few years of this beautiful town",
    category: "Cultural Essays",
    readTime: "6 min read",
    date: "Jul 16, 2026",
    bgImage: "https://substack-post-media.s3.amazonaws.com/public/images/f7194e58-070a-45cd-abb4-7dc005e3ee09_877x500.jpeg",
    url: "https://wiseralph21.substack.com/p/development-has-an-address-so-does",
  },
  {
    id: "stranger-memories",
    title: "A STRANGER WITH MEMORIES",
    subtitle: "What an old shopkeeper taught me about showing up",
    category: "Short Stories & Life",
    readTime: "5 min read",
    date: "Jul 10, 2026",
    bgImage: "https://substack-post-media.s3.amazonaws.com/public/images/bc3f9897-e978-4ca6-b121-65a4abd9bc0a_736x696.jpeg",
    url: "https://wiseralph21.substack.com/p/a-stranger-with-memories",
  },
  {
    id: "cost-of-silence",
    title: "The Cost of Our Silence",
    subtitle: "not so democratic nation",
    category: "Society & Commentary",
    readTime: "7 min read",
    date: "Jul 16, 2026",
    bgImage: "https://substack-post-media.s3.amazonaws.com/public/images/6f7bec6f-52d9-4b4f-a4d3-179b1e0e1d96_1025x576.jpeg",
    url: "https://wiseralph21.substack.com/p/the-cost-of-our-silence",
  },
  {
    id: "friendships-ended",
    title: "The Friendships That Just Ended",
    subtitle: "And Nobody Did Anything Wrong",
    category: "Personal Essays & Reflections",
    readTime: "5 min read",
    date: "Jul 18, 2026",
    bgImage: "https://substack-post-media.s3.amazonaws.com/public/images/bc3f9897-e978-4ca6-b121-65a4abd9bc0a_736x696.jpeg",
    url: "https://wiseralph21.substack.com/p/the-friendships-that-just-ended",
  },
];

export function SubstackSection() {
  const [posts, setPosts] = useState<SubstackPost[]>(FALLBACK_POSTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

  // Live Auto-Fetching Substack Posts API with Cache Busting & Multi-Proxy Waterfall
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveSubstackPosts() {
      try {
        setIsLiveSyncing(true);
        const timestamp = Date.now();
        const rawTargetUrl = `https://wiseralph21.substack.com/api/v1/posts?limit=10&t=${timestamp}`;

        // Waterfall endpoints with cache-busting
        const endpoints = [
          `https://corsproxy.io/?${encodeURIComponent(rawTargetUrl)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(rawTargetUrl)}`,
          rawTargetUrl,
        ];

        let rawData: any = null;

        for (const url of endpoints) {
          try {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) {
              const parsed = await res.json();
              if (Array.isArray(parsed) && parsed.length > 0) {
                rawData = parsed;
                break;
              }
            }
          } catch (e) {
            // Try next proxy
          }
        }

        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return;

        const parsedPosts: SubstackPost[] = rawData.map((item: any) => {
          // Parse date
          const dateObj = item.post_date ? new Date(item.post_date) : new Date();
          const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          // Estimate read time
          const wordCount = item.wordcount || 500;
          const readMins = Math.max(1, Math.ceil(wordCount / 200));

          // Find background cover image
          let coverImg = item.cover_image || "";
          if (!coverImg && item.body_html) {
            const imgMatch = item.body_html.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1]) {
              coverImg = imgMatch[1];
            }
          }

          // Clean subtitle
          const subtitleStr = item.subtitle || item.description || "";

          return {
            id: String(item.id || item.slug || Math.random()),
            title: item.title ? item.title.trim() : "Untitled Essay",
            subtitle: subtitleStr.trim(),
            category: "Substack Journal",
            readTime: `${readMins} min read`,
            date: formattedDate,
            bgImage: coverImg,
            url: item.canonical_url || `https://wiseralph21.substack.com/p/${item.slug}`,
          };
        });

        if (isMounted && parsedPosts.length > 0) {
          setPosts(parsedPosts);
        }
      } catch (err) {
        console.warn("Substack live sync notice: using fallback posts snapshot", err);
      } finally {
        if (isMounted) setIsLiveSyncing(false);
      }
    }

    fetchLiveSubstackPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1));
  };

  const currentPost = posts[currentIndex] || posts[0];
  const hasImage = Boolean(currentPost?.bgImage && currentPost.bgImage.trim().length > 0);

  return (
    <section className="relative w-full min-h-screen bg-[#06060b] overflow-hidden flex flex-col justify-center border-t border-white/10 py-24 px-6 md:px-12">
      {/* Subtle Background Glow Accent (Substack Orange tint) */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-[#FF6719]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 flex flex-col gap-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-[#FF6719]" />
              <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-[#FF6719]">
                LIVE SUBSTACK FEED
              </span>
              {isLiveSyncing && (
                <RefreshCw className="w-3 h-3 text-[#FF6719] animate-spin opacity-70 ml-1" />
              )}
            </div>

            <h2 className="text-4xl md:text-6xl font-serif font-medium text-white tracking-tight">
              Substack Journal
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://substack.com/@wiseralph21"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#FF6719]/10 hover:bg-[#FF6719]/20 border border-[#FF6719]/30 text-[#FF6719] font-mono text-xs uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-[#FF6719]/5"
            >
              <BookOpen className="w-4 h-4" />
              <span>@wiseralph21</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all active:scale-95 cursor-pointer"
                aria-label="Previous essay"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all active:scale-95 cursor-pointer"
                aria-label="Next essay"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Featured Hero Slider */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.8)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPost.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              {hasImage ? (
                <>
                  {/* Background Article Image */}
                  <img
                    src={currentPost.bgImage}
                    alt={currentPost.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/DOMEGALLERY/IMG_1353.jpeg";
                    }}
                  />
                  {/* Multi-stage Gradient Overlays for photo backgrounds */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                </>
              ) : (
                /* Pure Substack Brand Orange-Dark Canvas (No poster/photo background) */
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1c0c05] via-[#0d0914] to-[#06060b] flex items-center justify-center p-8 overflow-hidden">
                  {/* Substack Radial Brand Spotlight */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,#FF6719_0%,transparent_60%)] opacity-20 blur-[90px] pointer-events-none" />
                  
                  {/* Subtle Substack Grid Guidelines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,103,25,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,103,25,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

                  {/* Giant Decorative Watermark Quote Icon */}
                  <Quote className="absolute right-12 bottom-6 w-64 h-64 text-[#FF6719]/10 pointer-events-none rotate-12" />
                </div>
              )}

              {/* Article Content Overlay */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-14 max-w-3xl">
                {/* Meta Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#FF6719]/20 border border-[#FF6719]/40 text-[#FF6719] font-mono text-[10px] uppercase tracking-widest font-semibold">
                    {currentPost.category}
                  </span>
                  <span className="text-white/40 text-xs font-mono">
                    {currentPost.date}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-white/60 text-xs font-mono">
                    {currentPost.readTime}
                  </span>
                </div>

                {/* Article Title */}
                <h3 className="text-2xl md:text-4xl font-serif italic text-white font-medium tracking-tight mb-4 drop-shadow-md leading-tight">
                  {currentPost.title}
                </h3>

                {/* Article Subtitle */}
                {currentPost.subtitle && (
                  <p className="text-white/70 font-sans text-sm md:text-base leading-relaxed font-light mb-8 max-w-2xl line-clamp-2 md:line-clamp-3">
                    {currentPost.subtitle}
                  </p>
                )}

                {/* CTA Button */}
                <a
                  href={currentPost.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white hover:bg-[#FF6719] text-black hover:text-white font-semibold font-mono text-xs uppercase tracking-widest transition-all duration-300 w-fit active:scale-95 shadow-xl mt-2"
                >
                  <span>Read Article on Substack</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Thumbnail Bar / Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {posts.map((post, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={post.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative rounded-2xl p-4 text-left border transition-all duration-500 overflow-hidden cursor-pointer ${
                  isActive
                    ? "bg-white/10 border-[#FF6719]/60 shadow-lg scale-[1.02]"
                    : "bg-white/[0.03] border-white/10 hover:bg-white/5 hover:border-white/20"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSubstackIndicator"
                    className="absolute top-0 left-0 right-0 h-1 bg-[#FF6719]"
                    transition={{ duration: 0.3 }}
                  />
                )}

                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono text-[#FF6719] uppercase tracking-wider font-semibold">
                    0{idx + 1}
                  </span>
                  <span className="text-[9px] font-mono text-white/40">{post.date}</span>
                </div>

                <h4 className="text-xs md:text-sm font-serif font-medium text-white line-clamp-1 mb-1">
                  {post.title}
                </h4>
                <p className="text-[11px] font-sans text-white/50 line-clamp-1">
                  {post.category}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
