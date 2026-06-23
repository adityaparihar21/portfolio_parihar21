import { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon } from "lucide-react";

export function InteractiveTerminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ command: string; output: React.ReactNode }[]>([
    {
      command: "init",
      output: (
        <div>
          <span className="text-[#a8c4e0]">AP_SYS [Version 2.1.0]</span>
          <br />
          <span className="text-[rgba(120,160,200,0.6)]">
            (c) 2026 Aditya Parihar. All rights reserved.
            <br />
            Type 'help' to see available commands.
          </span>
        </div>
      ),
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll terminal body to bottom when history changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    let output: React.ReactNode = "";

    switch (trimmedCmd) {
      case "help":
        output = "AVAILABLE COMMANDS: whoami, skills, skills --deep, projects, contact, philosophy, status, ls, clear";
        break;
      case "whoami":
        output = "Aditya Parihar. BTech CSE @ UPES. Architecting systems and editing visual narratives.";
        break;
      case "skills":
        output = "LANGUAGES: Java, Python, TS/JS, C++, SQL\nFRAMEWORKS: React, Node.js, Spring Boot, Three.js\nTOOLS: Git, Docker, AWS, OpenCV";
        break;
      case "skills --deep":
        output = "You found it. I also know Premiere Pro, After Effects, DaVinci Resolve, and cinematic sound design. Sometimes the best systems aren't code.";
        break;
      case "projects":
        output = "LOADING PROTOCOLS...\n001. Interactive Portfolio (WebGL)\n002. Communal Typewriter Journal (Sockets)\n003. ASCII Engine (Java/OpenCV)\n004. Trip Co (AI/LLM)\n005. WeatherHUT (React)";
        break;
      case "contact":
        output = "INITIATING HANDSHAKE...\nEmail: adityaparihar21@gmail.com\nGitHub: github.com/adityaparihar21\nLinkedIn: linkedIn.com/in/adityaparihar21";
        break;
      case "philosophy":
        output = "\"Most code solves a problem. Good code tells a story. Great code doesn't need to explain itself.\"";
        break;
      case "status":
        output = "SYSTEM: Online\nCOFFEE_LEVEL: Critical\nSLEEP: false\nCURRENT_OBJECTIVE: Build something that outlives the hype.";
        break;
      case "ls":
        output = "resume.pdf  projects/  src/  secrets.key (Permission Denied)";
        break;
      case "clear":
        setHistory([]);
        return;
      case "":
        output = "";
        break;
      default:
        output = `Command not found: ${cmd}. Type 'help' for available commands.`;
    }

    if (trimmedCmd !== "clear") {
      setHistory((prev) => [
        ...prev,
        {
          command: cmd,
          output: <div className="whitespace-pre-wrap text-[rgba(168,196,224,0.8)]">{output}</div>,
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    }
  };

  return (
    <div className="w-full bg-[#050810] border border-[rgba(100,150,210,0.2)] rounded-lg shadow-2xl flex flex-col font-mono text-[11px] md:text-[13px] overflow-hidden max-w-[800px] mx-auto h-[300px] md:h-[400px]"
         onClick={() => inputRef.current?.focus()}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[rgba(100,150,210,0.05)] border-b border-[rgba(100,150,210,0.1)]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-[#a8c4e0]" />
          <span className="text-[11px] text-[#a8c4e0] tracking-widest uppercase">ap_terminal (Interactive)</span>
        </div>
      </div>

      {/* Body */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[rgba(100,150,210,0.2)] overscroll-contain"
        data-lenis-prevent="true"
      >
        <div className="flex flex-col gap-4">
          {history.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              {item.command !== "init" && (
                <div className="flex gap-2">
                  <span className="text-[#3ddc84]">aditya@sys</span>
                  <span className="text-[#a8c4e0]">~ %</span>
                  <span className="text-[#c8dcf4]">{item.command}</span>
                </div>
              )}
              {item.output && <div className="ml-2">{item.output}</div>}
            </div>
          ))}
          
          <div className="flex gap-2 items-center">
            <span className="text-[#3ddc84]">aditya@sys</span>
            <span className="text-[#a8c4e0]">~ %</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-[#c8dcf4] caret-[#a8c4e0]"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
