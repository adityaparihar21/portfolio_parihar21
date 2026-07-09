import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ExternalLink } from "lucide-react";

export type DrawerProject = {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string;
  href: string;
  repo?: string;
  role?: string;
  techStack?: string[];
  problem?: string;
  solution?: string;
};

export function ProjectDrawer({
  project,
  isOpen,
  onClose,
}: {
  project: DrawerProject | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && project && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // smooth ease out expo
            className="relative w-full max-w-2xl h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto"
            data-lenis-prevent="true"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Cover Media */}
            <div className="w-full aspect-video bg-[#111] overflow-hidden relative">
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover opacity-90"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-mono text-xs text-white/30 tracking-widest uppercase">
                    No Image Available
                  </span>
                </div>
              )}
              {/* Fade gradient at bottom of image */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
            </div>

            {/* Content Container */}
            <div className="p-8 md:p-12 flex flex-col gap-12">
              {/* Header */}
              <div className="flex flex-col gap-4">
                <span className="font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#e8b23d]">
                  {project.category}
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-medium leading-tight tracking-tight text-white">
                  {project.title}
                </h2>
                <p className="text-white/60 font-light leading-relaxed text-sm md:text-base mt-2">
                  {project.description}
                </p>
              </div>

              {/* Grid Details */}
              {(project.role || project.techStack) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                  {project.role && (
                    <div className="flex flex-col gap-3">
                      <h4 className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40">
                        Role
                      </h4>
                      <p className="text-white/90 text-sm">{project.role}</p>
                    </div>
                  )}
                  {project.techStack && (
                    <div className="flex flex-col gap-3">
                      <h4 className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40">
                        Tech Stack
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.techStack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/80 whitespace-nowrap"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Story Sections */}
              {(project.problem || project.solution) && (
                <div className="flex flex-col gap-10 pt-8 border-t border-white/10">
                  {project.problem && (
                    <div className="flex flex-col gap-4">
                      <h3 className="font-serif text-2xl text-white">
                        The Problem
                      </h3>
                      <p className="text-white/70 font-light leading-relaxed text-sm md:text-base">
                        {project.problem}
                      </p>
                    </div>
                  )}
                  {project.solution && (
                    <div className="flex flex-col gap-4">
                      <h3 className="font-serif text-2xl text-white">
                        The Solution
                      </h3>
                      <p className="text-white/70 font-light leading-relaxed text-sm md:text-base">
                        {project.solution}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom CTAs */}
              <div className="pt-12 pb-8 flex flex-col sm:flex-row gap-4">
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#e8b23d] text-black px-8 py-4 rounded-full font-semibold tracking-wide text-sm transition-transform hover:scale-105 active:scale-95"
                >
                  View Live Project <ExternalLink className="h-4 w-4" />
                </a>
                {project.repo && (
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-semibold tracking-wide text-sm transition-all hover:bg-white/10"
                  >
                    View Source Code
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
