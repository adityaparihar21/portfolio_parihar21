const fs = require('fs');

const file = 'src/components/EngineeringPortfolio.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `const getExtendedProject = (
  p: ReturnType<typeof useContent>["selectedWork"]["projects"][0],
): TechProject => {
  const isWip = p.id === "trip-co";
  
  let writeup = "";
  let codeSnippet = "";
  let metrics = [];

  switch (p.id) {
    case "portfolio":
      writeup = "Architectural Overview:\\n\\nThe primary engineering challenge for the portfolio involved orchestrating high-performance WebGL context alongside complex GSAP scroll timelines. \\n\\nApproach:\\nI implemented a custom Lenis smooth-scroll instance synchronized with Three.js rendering loops, decoupling the DOM layout from 3D transformations to maintain a strict 60fps budget. The routing system utilizes a split-theme approach (Creative vs Technical) leveraging React Context and Framer Motion for seamless page transitions.";
      codeSnippet = "// Synchronized Scroll Loop\\nuseFrame((state) => {\\n  if (!lenisRef.current) return;\\n  const scrollY = lenisRef.current.scroll;\\n  camera.position.y = THREE.MathUtils.lerp(\\n    camera.position.y,\\n    -scrollY * 0.05,\\n    0.1\\n  );\\n});";
      metrics = [{ label: "fps", value: "60" }, { label: "lighthouse score", value: "100" }];
      break;
    case "ctj":
      writeup = "Architectural Overview:\\n\\nCommunal Typewriter Journal required a robust state management system to handle real-time ink ribbon switching, sound design triggers, and analog typography emulation.\\n\\nApproach:\\nI utilized a functional reactive model to isolate side-effects like audio playback and DOM mutations from the React render cycle. The typewriter sounds are preloaded and managed via a custom AudioContext hook to ensure zero-latency playback on keydown.";
      codeSnippet = "// AudioContext Keydown Handler\\nconst playKeystroke = useCallback((key) => {\\n  if (!audioCtx.current) return;\\n  const buffer = keyBuffers.current[key] || defaultKeyBuffer;\\n  const source = audioCtx.current.createBufferSource();\\n  source.buffer = buffer;\\n  source.connect(audioCtx.current.destination);\\n  source.start(0);\\n}, []);";
      metrics = [{ label: "audio latency", value: "<10ms" }, { label: "state updates", value: "O(1)" }];
      break;
    case "ascii-engine":
      writeup = "Architectural Overview:\\n\\nThe ASCII Engine transforms high-resolution webcam feeds into dynamic character matrices in real-time, requiring intensive matrix operations.\\n\\nApproach:\\nBuilt using Java and OpenCV, the engine maps pixel luminance to a predefined ASCII density string. I optimized the frame processing pipeline by downscaling the capture matrix and applying parallel stream processing to compute character brightness indices, achieving high framerates without native GPU acceleration.";
      codeSnippet = "// Luminance to ASCII Mapping\\npublic char getAsciiChar(int r, int g, int b) {\\n  double luminance = 0.299 * r + 0.587 * g + 0.114 * b;\\n  int index = (int) Math.round((luminance / 255.0) * (ASCII_CHARS.length() - 1));\\n  return ASCII_CHARS.charAt(index);\\n}";
      metrics = [{ label: "throughput", value: "30fps" }, { label: "cpu footprint", value: "optimized" }];
      break;
    case "trip-co":
      writeup = "Architectural Overview:\\n\\nTrip Co leverages LLMs to generate structured travel itineraries based on dynamic user constraints like budget, duration, and dietary preferences.\\n\\nApproach:\\nCurrently in development, the system uses prompt-chaining and JSON schemas to enforce strict data structures from the AI provider. The frontend is built with React, focusing on a highly responsive timeline view to visualize the generated itineraries.";
      codeSnippet = "// AI Payload Schema\\nconst itinerarySchema = z.object({\n  days: z.array(z.object({\n    date: z.string(),\n    activities: z.array(z.object({\n      time: z.string(),\n      location: z.string(),\n      costEstimate: z.number()\n    }))\n  }))\n});";
      metrics = [{ label: "status", value: "active dev" }, { label: "stack", value: "AI + React" }];
      break;
    case "weather-hut":
      writeup = "Architectural Overview:\\n\\nWeatherHUT is a minimalist weather visualization dashboard designed to fetch and display meteorological data with high reliability.\\n\\nApproach:\\nI integrated multiple weather APIs with fallback mechanisms to ensure data availability. The UI adapts its color palette dynamically based on the current weather condition using CSS variables and React Context, creating an immersive, context-aware user experience.";
      codeSnippet = "// Dynamic Weather Theme Injection\\nuseEffect(() => {\\n  const theme = getThemeForCondition(weather.id);\\n  document.documentElement.style.setProperty('--bg-primary', theme.primary);\\n  document.documentElement.style.setProperty('--bg-secondary', theme.secondary);\\n}, [weather]);";
      metrics = [{ label: "api fallback", value: "active" }, { label: "ux pattern", value: "adaptive" }];
      break;
    default:
      writeup = "Architectural Overview:\\n\\nEngineering challenge focusing on robust architecture and performance.\\n\\nApproach:\\nStrict separation of concerns and optimized rendering.";
      codeSnippet = "// Implementation\\nconst init = () => {\\n  setupPipeline();\\n};";
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
};`;

content = content.replace(/const getExtendedProject = \([\s\S]*?\}\s*\};\s*\};/m, replacement);
content = content.replace(/v2\.1 — 2024 — Dehradun \/ Remote/g, "v2.1 — 2026 — Dehradun / Remote");
fs.writeFileSync(file, content);
console.log('updated getExtendedProject and 2024->2026 in EngineeringPortfolio');
