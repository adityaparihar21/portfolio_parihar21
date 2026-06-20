import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Cpu, Database, Network, Activity, ArrowDown } from "lucide-react";

export function DevDashboardHero() {
  const [logs, setLogs] = useState<string[]>([]);
  const [sysTime, setSysTime] = useState("");
  const [uptime, setUptime] = useState(0);

  const initialLogs = [
    "systemctl start aditya-portfolio-daemon",
    "Loading configuration files... OK",
    "Establishing WebGL context... OK",
    "Initializing Three.js PBR rendering maps... OK",
    "Connecting to cognitive neural APIs... OK",
    "Systems status: ACTIVE. Ready for exploration.",
  ];

  // Typing effect for the terminal logs
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < initialLogs.length) {
        setLogs((prev) => [...prev, initialLogs[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  // System time and uptime counter
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSysTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const uptimeInterval = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (sec % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-center items-center bg-black overflow-hidden px-6 pt-24 pb-12 border-b border-white/10">
      {/* Carbon Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

      {/* Subtle Ice Blue Glows */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-[#A5C9CA]/5 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-white/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-[1200px] w-full flex flex-col lg:flex-row gap-12 items-center justify-between mt-8">
        {/* Profile Info & Quick Overview */}
        <div className="flex flex-col items-start gap-6 max-w-xl text-left w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-mono text-gray-300 tracking-wider">
            <Cpu className="h-3.5 w-3.5 animate-pulse text-[#A5C9CA]" />
            SYSTEMS ENGINEER / DEVELOPER
          </div>

          <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Aditya Parihar
          </h1>

          <p className="font-sans text-base md:text-lg font-light leading-relaxed text-gray-400">
            Specializing in Artificial Intelligence, machine learning interfaces, and
            high-performance backend architectures. I design robust systems and interactive logic
            with absolute precision.
          </p>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 w-full mt-4 font-mono">
            <div className="bg-[#0A0A0A] border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <Activity className="h-5 w-5 text-[#A5C9CA] shrink-0" />
              <div>
                <div className="text-[10px] text-gray-500 tracking-wider uppercase">Uptime</div>
                <div className="text-sm font-semibold text-white">{formatUptime(uptime)}</div>
              </div>
            </div>
            <div className="bg-[#0A0A0A] border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <Database className="h-5 w-5 text-gray-400 shrink-0" />
              <div>
                <div className="text-[10px] text-gray-500 tracking-wider uppercase">
                  Core Database
                </div>
                <div className="text-sm font-semibold text-white">MongoDB/SQL</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Diagnostics Terminal */}
        <div className="w-full lg:max-w-xl bg-black border border-white/15 rounded-xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col font-mono text-xs md:text-sm h-[320px]">
          {/* Terminal Window Header */}
          <div className="bg-[#0a0a0a] border-b border-white/10 px-4 py-2.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400 text-xs font-semibold">diagnostics_monitor.sh</span>
            </div>
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
            </div>
          </div>

          {/* Terminal Logs Content */}
          <div className="p-5 flex-1 flex flex-col gap-2 overflow-y-auto text-left scrollbar-none">
            <div className="text-gray-500">System Time: {sysTime}</div>
            <div className="text-gray-500">Connection Status: LOCALHOST via WEBSOCKETS</div>
            <div className="h-px bg-white/10 my-1" />

            {logs.map((log, i) => {
              const isCommand = log.startsWith("systemctl") || log.includes(".sh");
              return (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-600 select-none">{isCommand ? "$" : ">"}</span>
                  <span className={isCommand ? "text-white font-medium" : "text-gray-400"}>
                    {log}
                  </span>
                </div>
              );
            })}

            {logs.length < initialLogs.length && (
              <span className="h-4 w-1.5 bg-gray-400 animate-pulse shrink-0 inline-block align-middle ml-1" />
            )}
          </div>
        </div>
      </div>

      {/* Bounce Down Arrow */}
      <div className="absolute bottom-8 flex flex-col items-center gap-1.5 text-gray-600 hover:text-gray-300 transition-colors font-mono text-[10px] tracking-[0.2em] uppercase select-none">
        <span>Scroll to Diagnostics</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4" />
        </motion.div>
      </div>
    </section>
  );
}
