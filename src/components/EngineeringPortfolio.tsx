import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useContent } from "../lib/use-content";
import GitHubCalendar from "react-github-calendar";

// Define the shape of a project extending the existing content structure
type TechProject = ReturnType<typeof useContent>["selectedWork"]["projects"][0] & {
  status?: "Live" | "Archived" | "In progress";
  year?: string;
  writeup?: string;
  codeSnippet?: string;
  metrics?: { label: string; value: string }[];
  repo?: string;
  role?: string;
};

const getExtendedProject = (
  p: ReturnType<typeof useContent>["selectedWork"]["projects"][0],
): TechProject => {
  const isWip = p.id === "trip-co";
  
  let writeup = "";
  let codeSnippet = "";
  let metrics: { label: string; value: string }[] = [];

  switch (p.id) {
    case "portfolio":
      writeup = "Architectural Overview:\n\nThe primary engineering challenge for the portfolio involved orchestrating high-performance WebGL context alongside complex GSAP scroll timelines. \n\nApproach:\nI implemented a custom Lenis smooth-scroll instance synchronized with Three.js rendering loops, decoupling the DOM layout from 3D transformations to maintain a strict 60fps budget. The routing system utilizes a split-theme approach (Creative vs Technical) leveraging React Context and Framer Motion for seamless page transitions.";
      codeSnippet = "// Synchronized Scroll Loop\nuseFrame((state) => {\n  if (!lenisRef.current) return;\n  const scrollY = lenisRef.current.scroll;\n  camera.position.y = THREE.MathUtils.lerp(\n    camera.position.y,\n    -scrollY * 0.05,\n    0.1\n  );\n});";
      metrics = [{ label: "fps", value: "60" }, { label: "lighthouse score", value: "100" }];
      break;
    case "ctj":
      writeup = "Architectural Overview:\n\nCommunal Typewriter Journal required a robust state management system to handle real-time ink ribbon switching, sound design triggers, and analog typography emulation.\n\nApproach:\nI utilized a functional reactive model to isolate side-effects like audio playback and DOM mutations from the React render cycle. The typewriter sounds are preloaded and managed via a custom AudioContext hook to ensure zero-latency playback on keydown.";
      codeSnippet = "// AudioContext Keydown Handler\nconst playKeystroke = useCallback((key) => {\n  if (!audioCtx.current) return;\n  const buffer = keyBuffers.current[key] || defaultKeyBuffer;\n  const source = audioCtx.current.createBufferSource();\n  source.buffer = buffer;\n  source.connect(audioCtx.current.destination);\n  source.start(0);\n}, []);";
      metrics = [{ label: "audio latency", value: "<10ms" }, { label: "state updates", value: "O(1)" }];
      break;
    case "ascii-engine":
      writeup = "Architectural Overview:\n\nThe ASCII Engine transforms high-resolution webcam feeds into dynamic character matrices in real-time, requiring intensive matrix operations.\n\nApproach:\nBuilt using Java and OpenCV, the engine maps pixel luminance to a predefined ASCII density string. I optimized the frame processing pipeline by downscaling the capture matrix and applying parallel stream processing to compute character brightness indices, achieving high framerates without native GPU acceleration.";
      codeSnippet = "// Luminance to ASCII Mapping\npublic char getAsciiChar(int r, int g, int b) {\n  double luminance = 0.299 * r + 0.587 * g + 0.114 * b;\n  int index = (int) Math.round((luminance / 255.0) * (ASCII_CHARS.length() - 1));\n  return ASCII_CHARS.charAt(index);\n}";
      metrics = [{ label: "throughput", value: "30fps" }, { label: "cpu footprint", value: "optimized" }];
      break;
    case "trip-co":
      writeup = "Architectural Overview:\n\nTrip Co leverages LLMs to generate structured travel itineraries based on dynamic user constraints like budget, duration, and dietary preferences.\n\nApproach:\nCurrently in development, the system uses prompt-chaining and JSON schemas to enforce strict data structures from the AI provider. The frontend is built with React, focusing on a highly responsive timeline view to visualize the generated itineraries.";
      codeSnippet = "// AI Payload Schema\nconst itinerarySchema = z.object({\n  days: z.array(z.object({\n    date: z.string(),\n    activities: z.array(z.object({\n      time: z.string(),\n      location: z.string(),\n      costEstimate: z.number()\n    }))\n  }))\n});";
      metrics = [{ label: "status", value: "active dev" }, { label: "stack", value: "AI + React" }];
      break;
    case "weather-hut":
      writeup = "Architectural Overview:\n\nWeatherHUT is a minimalist weather visualization dashboard designed to fetch and display meteorological data with high reliability.\n\nApproach:\nI integrated multiple weather APIs with fallback mechanisms to ensure data availability. The UI adapts its color palette dynamically based on the current weather condition using CSS variables and React Context, creating an immersive, context-aware user experience.";
      codeSnippet = "// Dynamic Weather Theme Injection\nuseEffect(() => {\n  const theme = getThemeForCondition(weather.id);\n  document.documentElement.style.setProperty('--bg-primary', theme.primary);\n  document.documentElement.style.setProperty('--bg-secondary', theme.secondary);\n}, [weather]);";
      metrics = [{ label: "api fallback", value: "active" }, { label: "ux pattern", value: "adaptive" }];
      break;
    default:
      writeup = "Architectural Overview:\n\nEngineering challenge focusing on robust architecture and performance.\n\nApproach:\nStrict separation of concerns and optimized rendering.";
      codeSnippet = "// Implementation\nconst init = () => {\n  setupPipeline();\n};";
      metrics = [];
  }

  return {
    ...p,
    status: isWip ? "In progress" : "Live",
    year: "2026",
    role: "Lead Engineer",
    repo: p.repo || undefined,
    writeup,
    codeSnippet,
    metrics,
  };
};

export function EngineeringPortfolio({ data }: { data: ReturnType<typeof useContent> }) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [sysTime, setSysTime] = useState("");
  const [selectedProject, setSelectedProject] = useState<TechProject | null>(null);

  const filters = ["ALL", "ENGINEERING", "SYSTEMS", "OPEN SOURCE", "EXPERIMENTS"];
  const targetText = "building systems\nthat don't ask\nfor attention.";

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(targetText.slice(0, i));
      i++;
      if (i > targetText.length) {
        clearInterval(interval);
        // Blinking cursor for 1.2s then fade
        setTimeout(() => setShowCursor(false), 1200);
      }
    }, 38);
    return () => clearInterval(interval);
  }, []);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSysTime(
        now.getUTCHours().toString().padStart(2, "0") +
          ":" +
          now.getUTCMinutes().toString().padStart(2, "0") +
          ":" +
          now.getUTCSeconds().toString().padStart(2, "0") +
          " UTC",
      );
    };
    updateTime();
    const int = setInterval(updateTime, 1000);
    return () => clearInterval(int);
  }, []);

  // Hydrate projects
  const projects = useMemo(() => {
    return data.selectedWork.projects.map(getExtendedProject);
  }, [data]);

  // Lock body scroll when a project is open
  useEffect(() => {
    if (selectedProject) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [selectedProject]);

  return (
    <div className="min-h-screen bg-[#070b12] text-[#a8c4e0] font-mono selection:bg-[rgba(55,138,221,0.15)] selection:text-[#b8d4f0]">
      {/* Sub-navigation Filters */}
      <div className="fixed top-24 md:top-28 left-0 w-full px-6 md:px-12 z-40 mix-blend-difference pointer-events-none">
        <div className="flex gap-4 md:gap-8 pointer-events-auto overflow-x-auto scrollbar-none">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="text-[9px] uppercase tracking-[0.22em] flex items-center gap-1 cursor-crosshair pb-1 relative transition-colors duration-200"
              style={{ color: activeFilter === f ? "#a8c4e0" : "rgba(120,160,200,0.45)" }}
            >
              {f}
              {activeFilter === f && (
                <span className="absolute bottom-0 left-0 w-full h-[0.5px] bg-[rgba(100,150,210,0.55)]" />
              )}
              {activeFilter === f && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-[rgba(106,159,216,0.7)] ml-1"
                >
                  |
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-screen flex flex-col justify-center items-center px-6 md:px-12">
        {/* Static Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(100,150,210,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(100,150,210,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1200px] flex flex-col items-center text-center">
          <h1 className="font-mono font-light text-[clamp(32px,5vw,64px)] leading-[1.2] tracking-[-0.02em] whitespace-pre-wrap">
            {typedText}
            {showCursor && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block w-4 h-[clamp(32px,5vw,64px)] bg-[#a8c4e0] ml-2 align-bottom"
              />
            )}
          </h1>
          <div className="mt-8 text-[9px] uppercase tracking-[0.25em] text-[rgba(120,160,200,0.35)]">
            v2.1 — 2026 — Dehradun / Remote
          </div>
        </div>

        {/* Scroll Prompt & Clock */}
        <div className="absolute bottom-8 left-6 md:left-12 text-[8px] uppercase tracking-[0.4em] text-[rgba(120,160,200,0.45)]">
          scroll
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            _
          </motion.span>
        </div>
        <div className="absolute bottom-8 right-6 md:right-12 text-[11px] tracking-widest text-[rgba(120,160,200,0.3)] tabular-nums">
          {sysTime}
        </div>
      </section>

      {/* Strict CSS Project Grid with Images */}
      <section className="w-full px-6 md:px-12 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-[rgba(100,150,210,0.08)]">
          {projects.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="group relative p-6 border-r border-b border-[rgba(100,150,210,0.08)] bg-[#070b12] cursor-crosshair transition-all duration-200 hover:bg-[rgba(55,100,180,0.06)] hover:border-[rgba(100,150,210,0.3)] flex flex-col justify-between min-h-[400px] overflow-hidden"
            >
              {/* Background Image Overlay */}
              <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover grayscale mix-blend-luminosity"
                />
              </div>

              <div className="relative z-10">
                <div className="text-[9px] text-[rgba(120,160,200,0.25)] mb-4">
                  {(idx + 1).toString().padStart(3, "0")}
                </div>
                {/* Thumbnail Image for Mobile / Small Screens (optional, but requested by user) */}
                <div className="w-full h-32 mb-6 overflow-hidden border border-[rgba(100,150,210,0.15)] relative">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-[#070b12]/40 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                <h3 className="text-base font-normal text-[#a8c4e0] group-hover:text-[#c8dcf4] transition-colors duration-200">
                  {p.title}
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {p.category?.split("•").map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-1 bg-[rgba(55,138,221,0.1)] border border-[rgba(55,138,221,0.2)] rounded-full text-[9px] tracking-[0.12em] text-[rgba(106,159,216,0.8)]"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-[12px] font-light leading-relaxed text-[rgba(120,160,200,0.45)] max-w-[90%]">
                  {p.description?.substring(0, 100)}
                  {(p.description?.length || 0) > 100 ? "..." : ""}
                </p>
              </div>

              <div className="relative z-10 flex justify-between items-end mt-8 text-[11px] uppercase tracking-widest text-[rgba(120,160,200,0.45)]">
                <span>{p.year}</span>
                <span className="flex items-center gap-2">
                  {p.status === "Live" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3ddc84]" />
                  )}
                  {p.status === "Archived" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgba(200,160,80,0.6)]" />
                  )}
                  {p.status === "In progress" && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ...
                    </motion.span>
                  )}
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* GitHub Contributions Box */}
        <div className="mt-32 w-full flex flex-col items-center">
          <h2 className="text-[12px] font-mono text-[rgba(120,160,200,0.5)] tracking-[0.2em] uppercase mb-8">
            Open Source Contributions
          </h2>
          <div className="bg-[#070b12] border border-[rgba(100,150,210,0.08)] p-8 md:p-12 w-full flex justify-center overflow-x-auto scrollbar-none">
            <div className="min-w-max">
              <GitHubCalendar 
                username="adityaparihar21" 
                colorScheme="dark"
                theme={{
                  dark: ['rgba(100,150,210,0.05)', 'rgba(106,159,216,0.3)', 'rgba(106,159,216,0.5)', 'rgba(106,159,216,0.8)', '#a8c4e0']
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Individual Project Full-Page Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[100] bg-[#070b12] overflow-y-auto"
            data-lenis-prevent="true"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="fixed top-8 right-8 z-[110] p-4 text-[rgba(120,160,200,0.5)] hover:text-[#a8c4e0] transition-colors cursor-crosshair bg-[#070b12]/80 backdrop-blur-md rounded-full"
            >
              <X className="w-6 h-6" strokeWidth={1} />
            </button>

            <div className="min-h-screen flex flex-col md:flex-row pt-24 pb-32 px-6 md:px-12 max-w-[1600px] mx-auto gap-12 md:gap-24 relative">
              {/* Left Column - Writeup */}
              <div className="w-full md:w-[65%] flex flex-col">
                <div className="w-full aspect-[16/9] mb-12 border border-[rgba(100,150,210,0.15)] overflow-hidden">
                  <img
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h1 className="text-4xl md:text-[48px] font-light tracking-[-0.02em] text-[#a8c4e0] mb-6">
                  {selectedProject.title}
                </h1>
                <div className="w-full h-[0.5px] bg-[rgba(100,150,210,0.15)] mb-12" />

                <div className="prose prose-invert prose-p:text-[#a8c4e0] prose-p:font-light prose-p:text-[14px] prose-p:leading-[1.9] max-w-none whitespace-pre-wrap">
                  {selectedProject.writeup}
                </div>

                {selectedProject.codeSnippet && (
                  <div className="mt-12 p-6 bg-[#050810] border border-[rgba(100,150,210,0.12)] rounded-[4px] overflow-x-auto">
                    <pre className="text-[12px] font-mono leading-[1.8]">
                      <code>
                        {selectedProject.codeSnippet.split("\n").map((line, i) => {
                          // Very basic syntax highlighting simulation
                          let hlLine = line;
                          if (
                            line.includes("function ") ||
                            line.includes("return ") ||
                            line.includes("if ")
                          ) {
                            hlLine = line.replace(
                              /(function|return|if)/g,
                              '<span style="color:#6a9fd8">$1</span>',
                            );
                          }
                          if (line.includes("//")) {
                            hlLine = `<span style="color:rgba(120,160,200,0.3)">${line}</span>`;
                          }
                          if (line.includes("'")) {
                            hlLine = hlLine.replace(
                              /'([^']+)'/g,
                              "<span style=\"color:rgba(180,210,160,0.8)\">'$1'</span>",
                            );
                          }
                          return <div key={i} dangerouslySetInnerHTML={{ __html: hlLine }} />;
                        })}
                      </code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Column - Metadata */}
              <div className="w-full md:w-[35%] flex flex-col border-l border-[rgba(100,150,210,0.12)] pl-8 md:pl-12 py-4 h-fit sticky top-32">
                <div className="flex flex-col gap-8 text-[9px] uppercase tracking-[0.2em] text-[rgba(120,160,200,0.45)]">
                  <div>
                    <span className="block mb-2 text-[#a8c4e0]">Stack</span>
                    {selectedProject.category?.replace(/•/g, ", ")}
                  </div>
                  <div>
                    <span className="block mb-2 text-[#a8c4e0]">Role</span>
                    {selectedProject.role}
                  </div>
                  <div>
                    <span className="block mb-2 text-[#a8c4e0]">Year</span>
                    {selectedProject.year}
                  </div>
                  <div>
                    <span className="block mb-2 text-[#a8c4e0]">Status</span>
                    {selectedProject.status}
                  </div>
                  {(selectedProject.repo || selectedProject.href) && (
                    <div className="flex flex-col gap-3 mt-4">
                      {selectedProject.repo && (
                        <a
                          href={selectedProject.repo}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[#6a9fd8] hover:text-[#a8c4e0] transition-colors hover:underline cursor-crosshair"
                        >
                          <ArrowRight className="w-3 h-3" /> GitHub Repository
                        </a>
                      )}
                      {(!selectedProject.repo || selectedProject.href !== selectedProject.repo) && selectedProject.href && (
                        <a
                          href={selectedProject.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[#6a9fd8] hover:text-[#a8c4e0] transition-colors hover:underline cursor-crosshair"
                        >
                          <ArrowRight className="w-3 h-3" /> Live Deployment
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {selectedProject.metrics && (
                  <div className="mt-16 flex flex-col gap-8">
                    {selectedProject.metrics.map((m, i) => (
                      <div key={i}>
                        <div className="text-[36px] font-light text-[#a8c4e0] tabular-nums leading-none mb-2">
                          {m.value}
                        </div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-[rgba(120,160,200,0.45)]">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Next Project Block */}
            <div className="w-full border-t border-[rgba(100,150,210,0.15)] mt-24 py-32 px-6 md:px-12 flex items-center justify-center cursor-crosshair hover:bg-[rgba(55,100,180,0.02)] transition-colors">
              <div className="text-[32px] font-light text-[#a8c4e0]">
                <span className="text-[rgba(120,160,200,0.3)] text-xl">next_</span>
                {projects.length > 0 && projects[(projects.indexOf(selectedProject) + 1) % projects.length]?.title}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Technical Footer */}
      <footer className="w-full px-6 md:px-12 py-8 border-t border-[rgba(100,150,210,0.1)] flex items-center justify-start">
        <span className="text-[9px] font-mono tracking-[0.22em] text-[rgba(120,160,200,0.25)]">
          ap@portfolioparihar21 — technical_work — build 2.1.0
        </span>
      </footer>
    </div>
  );
}
