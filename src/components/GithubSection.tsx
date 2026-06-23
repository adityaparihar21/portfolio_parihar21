import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Github, ArrowRight } from "lucide-react";

interface Commit {
  repo: string;
  msg: string;
  time: string;
  hash: string;
}

export function GithubSection() {
  const defaultStats = [
    { label: "Repositories", value: "34+" },
    { label: "Commits (YTD)", value: "1.2k" },
    { label: "Pull Requests", value: "89" },
    { label: "Stars", value: "210" },
  ];

  const defaultCommits = [
    {
      repo: "adityaparihar21/trip-co",
      msg: "feat(trip-co): implement AI itinerary pipeline with 2s streaming response",
      time: "2 hours ago",
      hash: "d92jf8e",
    },
    {
      repo: "adityaparihar21/ascii-webcam",
      msg: "fix(ascii): resolved memory leak in matrix frame buffer",
      time: "5 hours ago",
      hash: "34mf9dk",
    },
    {
      repo: "adityaparihar21/portfolio_parihar21",
      msg: "chore(portfolio): deployed v2.1 engineering subsystem",
      time: "1 day ago",
      hash: "88nd2kd",
    },
  ];

  const [stats, setStats] = useState(defaultStats);
  const [commits, setCommits] = useState<Commit[]>(defaultCommits);

  useEffect(() => {
    async function fetchGithubData() {
      try {
        const username = "adityaparihar21";
        
        // Fetch User Data for Repos
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) throw new Error("Rate limit or error");
        const userData = await userRes.json();

        // Fetch Repos for Stars
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        if (!reposRes.ok) throw new Error("Rate limit or error");
        const reposData = await reposRes.json();
        
        const totalStars = reposData.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0);

        setStats([
          { label: "Repositories", value: userData.public_repos.toString() },
          { label: "Commits (YTD)", value: "1.2k+" }, 
          { label: "Pull Requests", value: "89+" },   
          { label: "Stars", value: totalStars.toString() },
        ]);

        // We intentionally do not fetch recent commits dynamically here anymore
        // so that the exact terminal output requested by the user is always displayed.

      } catch (error) {
        console.error("Failed to fetch GitHub data, falling back to cached data:", error);
      }
    }

    fetchGithubData();
  }, []);

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yrs ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " mos ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hrs ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " secs ago";
  }

  return (
    <section className="w-full px-6 md:px-12 py-32 border-t border-[rgba(100,150,210,0.08)] bg-[#070b12] relative overflow-hidden font-mono">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(100,150,210,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(100,150,210,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-start">
          {/* Left Side: Stats & Info */}
          <div className="w-full md:w-1/3 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <Github className="w-8 h-8 text-[#a8c4e0]" />
              <h2 className="text-2xl text-[#a8c4e0] font-light tracking-tight">Open Source</h2>
            </div>

            <p className="text-[13px] text-[rgba(120,160,200,0.6)] leading-relaxed mb-12">
              Building in public. Not just commits — thinking out loud. I contribute to open-source systems, build custom tools, and document the process.
            </p>

            <div className="grid grid-cols-2 gap-8 mb-12">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-2xl text-[#c8dcf4] font-light mb-2">{s.value}</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[rgba(120,160,200,0.4)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://github.com/adityaparihar21"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-between w-full p-4 border border-[rgba(100,150,210,0.2)] bg-[rgba(55,138,221,0.05)] hover:bg-[rgba(55,138,221,0.1)] transition-colors group cursor-crosshair"
            >
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#a8c4e0]">
                View Profile
              </span>
              <ArrowRight className="w-4 h-4 text-[#a8c4e0] group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right Side: Terminal Window */}
          <div className="w-full md:w-2/3 border border-[rgba(100,150,210,0.15)] bg-[#050810] rounded-sm overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(100,150,210,0.1)] bg-[rgba(100,150,210,0.02)]">
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,95,86,0.5)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,189,46,0.5)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[rgba(39,201,63,0.5)]" />
              <div className="ml-4 text-[10px] text-[rgba(120,160,200,0.4)] tracking-wider">
                aditya@mbp: ~/github/activity
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-6 flex flex-col gap-6">
              <div className="text-[11px] text-[#a8c4e0] flex gap-2">
                <span className="text-[#3ddc84]">➜</span>
                <span className="text-[#6a9fd8]">~</span>
                <span>git log --oneline -n 3</span>
              </div>

              <div className="flex flex-col gap-5 pl-2 border-l border-[rgba(100,150,210,0.1)] ml-1">
                {commits.map((c, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    key={i}
                    className="relative pl-6"
                  >
                    <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[#050810] border border-[rgba(100,150,210,0.3)]" />
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3 text-[12px]">
                        <span className="text-[rgba(200,160,80,0.8)]">{c.hash}</span>
                        <span className="text-[#c8dcf4]">{c.msg}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-[rgba(120,160,200,0.4)]">
                        <span>{c.repo}</span>
                        <span>{c.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-[11px] text-[#a8c4e0] flex gap-2 mt-4">
                <span className="text-[#3ddc84]">➜</span>
                <span className="text-[#6a9fd8]">~</span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-3 bg-[#a8c4e0] inline-block align-middle"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
