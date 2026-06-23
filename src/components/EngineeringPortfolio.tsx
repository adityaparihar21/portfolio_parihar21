import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Terminal as TerminalIcon } from "lucide-react";
import { useContent } from "../lib/use-content";
import { InteractiveTerminal } from "./InteractiveTerminal";
import { GitHubCalendar } from "react-github-calendar";

// Define the shape of a project extending the existing content structure
type TechProject = ReturnType<typeof useContent>["selectedWork"]["projects"][0] & {
  status?: "Live" | "Archived" | "In progress";
  year?: string;
  writeup?: string;
  codeSnippet?: string;
  metrics?: { label: string; value: string }[];
  repo?: string;
  role?: string;
  filterCategory?: string[];
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
      writeup = "Problem: Most developer portfolios look identical. Bootstrap + dark theme + card grid.\n\nMy approach: Built a custom 3D WebGL environment integrated seamlessly with a DOM-based split theme layout. I didn't want the user to choose between \"looks good\" and \"functions well\" — I wanted both.\n\nTechnical decisions: Three.js for 3D processing, GSAP for timeline animations, and a decoupled React architecture to maintain strict 60fps performance across devices.\n\nResult: A portfolio that feels like a product, not a resume.";
      codeSnippet = "// Synchronized Scroll Loop\nuseFrame((state) => {\n  if (!lenisRef.current) return;\n  const scrollY = lenisRef.current.scroll;\n  camera.position.y = THREE.MathUtils.lerp(\n    camera.position.y,\n    -scrollY * 0.05,\n    0.1\n  );\n});";
      metrics = [{ label: "fps", value: "60" }, { label: "lighthouse score", value: "100" }];
      break;
    case "ctj":
      writeup = "Problem: Standard journaling apps feel sterile. I wanted to build something that had the tactile, atmospheric feel of an old typewriter in a dark room.\n\nMy approach: Focused heavily on sensory feedback — keystroke audio latency, visual \"ink\" bleeding effects, and an analog design language.\n\nTechnical decisions: Managed complex audio/visual state using functional reactive models to ensure zero-latency feedback on keystrokes.\n\nResult: A moody, cinematic web experience that people actually want to write in.";
      codeSnippet = "// AudioContext Keydown Handler\nconst playKeystroke = useCallback((key) => {\n  if (!audioCtx.current) return;\n  const buffer = keyBuffers.current[key] || defaultKeyBuffer;\n  const source = audioCtx.current.createBufferSource();\n  source.buffer = buffer;\n  source.connect(audioCtx.current.destination);\n  source.start(0);\n}, []);";
      metrics = [{ label: "audio latency", value: "<10ms" }, { label: "state updates", value: "O(1)" }];
      break;
    case "ascii-engine":
      writeup = "Problem: Processing video into ASCII usually requires GPU acceleration to run smoothly. I wanted to see if I could do it in pure Java.\n\nMy approach: Downscaled the webcam capture matrix and applied parallel stream processing.\n\nTechnical decisions: Mapped pixel luminance to an ASCII density string. Highly optimized matrix operations to achieve 30fps purely on the CPU.\n\nResult: A raw, functional CLI tool that turns reality into text in real time.";
      codeSnippet = "// Luminance to ASCII Mapping\npublic char getAsciiChar(int r, int g, int b) {\n  double luminance = 0.299 * r + 0.587 * g + 0.114 * b;\n  int index = (int) Math.round((luminance / 255.0) * (ASCII_CHARS.length() - 1));\n  return ASCII_CHARS.charAt(index);\n}";
      metrics = [{ label: "throughput", value: "30fps" }, { label: "cpu footprint", value: "optimized" }];
      break;
    case "trip-co":
      writeup = "Problem: Travel planning takes hours of research. AI can do it, but standard ChatGPT output is unformatted and hard to read.\n\nMy approach: Building a structured, visually appealing itinerary generator.\n\nTechnical decisions: Using prompt-chaining and strict JSON schemas to force LLMs to return predictable data. React frontend renders this as a clean, responsive timeline.\n\nResult: (In progress) A tool that gives you a full trip plan in seconds.";
      codeSnippet = "// AI Payload Schema\nconst itinerarySchema = z.object({\n  days: z.array(z.object({\n    date: z.string(),\n    activities: z.array(z.object({\n      time: z.string(),\n      location: z.string(),\n      costEstimate: z.number()\n    }))\n  }))\n});";
      metrics = [{ label: "status", value: "active dev" }, { label: "stack", value: "AI + React" }];
      break;
    case "weather-hut":
      writeup = "Problem: Most weather apps are cluttered with ads and unnecessary data.\n\nMy approach: Built a minimalist dashboard focused only on what matters, with an interface that adapts to the data it receives.\n\nTechnical decisions: Integrated multiple weather APIs with fallback routing for reliability. Used CSS variables tied to React Context for dynamic color palette shifts based on weather conditions.\n\nResult: A reliable, aesthetically pleasing utility app.";
      codeSnippet = "// Dynamic Weather Theme Injection\nuseEffect(() => {\n  const theme = getThemeForCondition(weather.id);\n  document.documentElement.style.setProperty('--bg-primary', theme.primary);\n  document.documentElement.style.setProperty('--bg-secondary', theme.secondary);\n}, [weather]);";
      metrics = [{ label: "api fallback", value: "active" }, { label: "ux pattern", value: "adaptive" }];
      break;
    default:
      writeup = "Architectural Overview:\n\nEngineering challenge focusing on robust architecture and performance.\n\nApproach:\nStrict separation of concerns and optimized rendering.";
      codeSnippet = "// Implementation\nconst init = () => {\n  setupPipeline();\n};";
      metrics = [];
  }

  let filterCategory: string[] = [];
  switch (p.id) {
    case "portfolio":
      filterCategory = ["ENGINEERING", "SYSTEMS"];
      break;
    case "ctj":
      filterCategory = ["ENGINEERING", "EXPERIMENTS"];
      break;
    case "ascii-engine":
      filterCategory = ["SYSTEMS", "EXPERIMENTS"];
      break;
    case "trip-co":
      filterCategory = ["ENGINEERING", "SYSTEMS"];
      break;
    case "weather-hut":
      filterCategory = ["ENGINEERING", "OPEN SOURCE"];
      break;
    default:
      filterCategory = ["ENGINEERING"];
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
    filterCategory,
  };
};

export function EngineeringPortfolio({ data }: { data: ReturnType<typeof useContent> }) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [sysTime, setSysTime] = useState("");
  const [selectedProject, setSelectedProject] = useState<TechProject | null>(null);

  const filters = ["ALL", "ENGINEERING", "SYSTEMS", "OPEN SOURCE", "EXPERIMENTS"];
  const targetTexts = [
    "building systems\nthat don't ask\nfor attention.",
    "building things\nthat outlive\nthe hype.",
    "writing code\nlike editing film —\nwith intention."
  ];

  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect
  useEffect(() => {
    const currentText = targetTexts[textIndex];
    let timeoutId: NodeJS.Timeout;

    if (isDeleting) {
      if (typedText.length > 0) {
        timeoutId = setTimeout(() => {
          setTypedText(currentText.substring(0, typedText.length - 1));
        }, 20); // Fast delete
      } else {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % targetTexts.length);
      }
    } else {
      if (typedText.length < currentText.length) {
        timeoutId = setTimeout(() => {
          setTypedText(currentText.substring(0, typedText.length + 1));
        }, 50); // Typing speed
      } else {
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, 3000); // Wait before deleting
      }
    }

    return () => clearTimeout(timeoutId);
  }, [typedText, isDeleting, textIndex]);

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

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (activeFilter === "ALL") return projects;
    return projects.filter(p => p.filterCategory?.includes(activeFilter));
  }, [projects, activeFilter]);

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
          <div className="mt-8 text-[14px] md:text-[16px] text-[rgba(120,160,200,0.6)] max-w-[600px] font-mono leading-[1.8]">
            <p>BTech CSE · AI & ML · UPES Dehradun</p>
            <p>Backend architecture. Computational logic. Things that work.</p>
            <p className="mt-2 text-[rgba(120,160,200,0.4)]">Also: Lead Video Editor @life_at_upes — because one obsession isn't enough.</p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-[11px] tracking-widest uppercase">
            <a href="#work" className="text-[#a8c4e0] hover:text-white transition-colors flex items-center gap-2">
              [ VIEW PROJECTS <ArrowRight className="w-3 h-3 inline" /> ]
            </a>
            <a href="/AP_ENG_RESUME.docx" download className="text-[#a8c4e0] hover:text-white transition-colors flex items-center gap-2">
              [ DOWNLOAD RESUME ↓ ]
            </a>
            <div className="text-[rgba(120,160,200,0.5)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> OPEN TO WORK
            </div>
          </div>

          <div className="mt-12 text-[9px] uppercase tracking-[0.25em] text-[rgba(120,160,200,0.35)]">
            V2.1 — 2026 — DEHRADUN / REMOTE
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

      {/* About & Philosophy Section */}
      <section id="about" className="w-full px-6 md:px-12 py-32 border-t border-[rgba(100,150,210,0.08)]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24">
          {/* About */}
          <div>
            <h2 className="text-[10px] tracking-[0.2em] text-[rgba(120,160,200,0.4)] mb-8 uppercase">Engineering meets cinematography</h2>
            <div className="space-y-6 text-[14px] md:text-[15px] font-light leading-relaxed text-[rgba(168,196,224,0.8)]">
              <p>I'm Aditya Parihar — a BTech CSE student specializing in AI & Machine Learning at UPES, with a focus on backend architecture, computational logic, and software systems that are highly performant.</p>
              <p>But I don't just write code. I edit film.</p>
              <p>For the past few years, I've worked as the Lead Video Editor & Collaborator for @life_at_upes, directing and editing visual narratives. That background completely changes how I engineer software. I don't just see functions and databases; I see pacing, rhythm, and structure.</p>
              <p>I believe the best codebases are like the best films: every frame has a purpose, every cut is intentional, and the final product feels effortless — even if it took 100 hours to build.</p>
            </div>
          </div>

          {/* Philosophy */}
          <div>
            <h2 className="text-[10px] tracking-[0.2em] text-[rgba(120,160,200,0.4)] mb-8 uppercase">What drives the work</h2>
            
            <blockquote className="border-l-2 border-[#a8c4e0] pl-6 py-2 mb-10 text-[16px] md:text-[18px] text-[#a8c4e0] italic">
              "Most code solves a problem. Good code tells a story. Great code doesn't need to explain itself."
            </blockquote>

            <div className="space-y-8">
              <div>
                <h3 className="text-[11px] tracking-widest text-[rgba(120,160,200,0.6)] uppercase mb-2">1. Intention</h3>
                <p className="text-[13px] text-[rgba(168,196,224,0.7)] leading-relaxed">No boilerplate. No bloated dependencies just because they're popular. If it's in the stack, it has a reason to be there.</p>
              </div>
              <div>
                <h3 className="text-[11px] tracking-widest text-[rgba(120,160,200,0.6)] uppercase mb-2">2. Rhythm</h3>
                <p className="text-[13px] text-[rgba(168,196,224,0.7)] leading-relaxed">A well-architected system has a natural flow. The data models make sense. The API routes are predictable. The UI responds exactly when the user expects it to.</p>
              </div>
              <div>
                <h3 className="text-[11px] tracking-widest text-[rgba(120,160,200,0.6)] uppercase mb-2">3. Obsession</h3>
                <p className="text-[13px] text-[rgba(168,196,224,0.7)] leading-relaxed">I don't stop when it "works." I stop when the edge cases are handled, the rendering is 60fps, and the terminal output looks as good as the GUI.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strict CSS Project Grid with Images */}
      <section id="work" className="w-full px-6 md:px-12 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-[rgba(100,150,210,0.08)]">
          {filteredProjects.map((p, idx) => (
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
        <div id="open-source" className="mt-32 w-full flex flex-col items-center">
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

      <section id="terminal" className="w-full px-6 md:px-12 py-32 border-t border-[rgba(100,150,210,0.08)] bg-[#070b12]">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
          <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-[10px] tracking-[0.2em] text-[rgba(120,160,200,0.4)] mb-4 uppercase">System Terminal</h2>
            <p className="text-[13px] text-[rgba(168,196,224,0.7)] leading-relaxed">
              Explore the system architecture. Type commands to discover hidden sections, tools, and philosophy.
            </p>
          </div>
          <InteractiveTerminal />
        </div>
      </section>

      <section id="contact" className="w-full px-6 md:px-12 py-32 border-t border-[rgba(100,150,210,0.08)] bg-[rgba(55,100,180,0.02)]">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-[10px] tracking-[0.2em] text-[rgba(120,160,200,0.4)] mb-8 uppercase">OPEN TO WORK</h2>
          
          <div className="space-y-6 text-[15px] md:text-[18px] font-light leading-relaxed text-[rgba(168,196,224,0.9)]">
            <p>I'm currently looking for Software Engineering roles, particularly in backend systems, AI integration, and full-stack architecture.</p>
            <p className="text-[rgba(120,160,200,0.7)]">Whether you're building something interesting, need a developer who understands both the system and the story, or just want to chat about code — my inbox is open.</p>
            <p className="text-[#a8c4e0] font-normal pt-4">Let's build something that matters.</p>
          </div>

          <div className="mt-12">
            <a href="mailto:adityaparihar21@gmail.com" className="inline-block border border-[rgba(100,150,210,0.3)] px-8 py-4 text-[11px] tracking-widest text-[#a8c4e0] hover:bg-[#a8c4e0] hover:text-[#070b12] transition-colors uppercase">
              Email Me →
            </a>
          </div>
        </div>
      </section>

      {/* Technical Footer */}
      <footer className="w-full px-6 md:px-12 py-8 border-t border-[rgba(100,150,210,0.1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-[9px] font-mono tracking-[0.22em] text-[rgba(120,160,200,0.25)] flex items-center gap-4">
          ap@portfolioparihar21 — technical_work — build 2.1.0
        </span>
        <span className="text-[9px] font-mono tracking-[0.22em] text-[rgba(120,160,200,0.25)]">
          Dehradun / Remote
        </span>
      </footer>
    </div>
  );
}
