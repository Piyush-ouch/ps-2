"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gift,
  Copy,
  Check,
  Share2,
  Trophy,
  Users,
  Wallet,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Crown,
  ShieldCheck,
  Mail,
  Send,
  HelpCircle,
} from "lucide-react";
import axios from "axios";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import useGetMe from "@/hooks/useGetMe";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface ReferralHistoryItem {
  id: string;
  referredUser: {
    name: string;
    emailMasked: string;
  };
  referrerBonus: number;
  status: string;
  createdAt: string;
}

interface LeaderboardItem {
  rank: number;
  id: string;
  name: string;
  maskedEmail: string;
  role: string;
  referralCount: number;
  totalReferralEarnings: number;
}

export default function ReferralPage() {
  useGetMe(true);
  const { userData } = useSelector((state: RootState) => state.user);
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code");

  const [referralCode, setReferralCode] = useState<string>("");
  const [shareableUrl, setShareableUrl] = useState<string>("");
  const [referralCredits, setReferralCredits] = useState<number>(0);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [hasBeenReferred, setHasBeenReferred] = useState<boolean>(false);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);
  const [claimInput, setClaimInput] = useState<string>("");
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimMessage, setClaimMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (urlCode) {
      setClaimInput(urlCode.toUpperCase());
    }
  }, [urlCode]);

  useEffect(() => {
    fetchReferralData();
    fetchLeaderboard();
  }, [userData]);

  const fetchReferralData = async () => {
    try {
      const res = await axios.get("/api/referral");
      if (res.data) {
        setReferralCode(res.data.referralCode || "");
        setShareableUrl(res.data.shareableUrl || "");
        setReferralCredits(res.data.referralCredits || 0);
        setReferralCount(res.data.referralCount || 0);
        setTotalEarnings(res.data.totalReferralEarnings || 0);
        setHasBeenReferred(res.data.hasBeenReferred || false);
        setHistory(res.data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch referral info:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const res = await axios.get("/api/referral/leaderboard");
      if (res.data && res.data.leaderboard) {
        setLeaderboard(res.data.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Join me on Rydex and get $25 in free ride credits using my referral code: ${referralCode}!\n\nSign up here: ${shareableUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Get $25 off your first vehicle booking on Rydex with code ${referralCode}! 🚀`
    );
    const url = encodeURIComponent(shareableUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("Get $25 in free ride credits on Rydex!");
    const body = encodeURIComponent(
      `Hey!\n\nI'm using Rydex to book bikes, cars, and transport vehicles. Sign up with my code ${referralCode} or click the link below to get $25 in bonus ride credits:\n\n${shareableUrl}\n\nEnjoy!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleClaimCode = async () => {
    if (!claimInput.trim()) return;
    setClaiming(true);
    setClaimMessage(null);
    try {
      const res = await axios.post("/api/referral/claim", {
        referralCode: claimInput.trim().toUpperCase(),
      });
      setClaimMessage({
        text: res.data.message || "Referral code claimed successfully!",
        type: "success",
      });
      setClaimInput("");
      fetchReferralData();
      fetchLeaderboard();
    } catch (error: any) {
      setClaimMessage({
        text: error.response?.data?.message || "Failed to claim referral code.",
        type: "error",
      });
    } finally {
      setClaiming(false);
    }
  };

  // Top 3 Podium
  const top1 = leaderboard.find((item) => item.rank === 1);
  const top2 = leaderboard.find((item) => item.rank === 2);
  const top3 = leaderboard.find((item) => item.rank === 3);

  return (
    <div className="min-h-screen bg-[#070707] text-white selection:bg-amber-500 selection:text-black font-sans">
      <Nav />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative text-center max-w-3xl mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs md:text-sm font-semibold tracking-wide uppercase"
          >
            <Sparkles size={16} className="animate-pulse text-amber-400" />
            Rydex Rewards & Referral Program
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white"
          >
            Invite Friends, Earn <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">Free Credits</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            Share your unique referral code with friends. They receive <strong className="text-amber-400 font-semibold">$25 in ride credits</strong> upon joining, and you earn <strong className="text-amber-400 font-semibold">$50</strong> for every successful invite!
          </motion.p>
        </div>

        {/* METRICS DASHBOARD CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          {/* Card 1: Wallet Credits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.03] border border-white/10 p-6 backdrop-blur-xl shadow-xl hover:border-amber-500/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Wallet Credits</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet size={20} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white">${referralCredits}</span>
              <span className="text-xs text-amber-400 font-semibold ml-2">Credits Balance</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Usable on all bike, car & loading bookings</p>
          </motion.div>

          {/* Card 2: Friends Invited */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.03] border border-white/10 p-6 backdrop-blur-xl shadow-xl hover:border-amber-500/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Friends Invited</span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white">{referralCount}</span>
              <span className="text-xs text-blue-400 font-semibold ml-2">Successful Refers</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Active accounts joined using your code</p>
          </motion.div>

          {/* Card 3: Total Earnings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="relative rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.03] border border-white/10 p-6 backdrop-blur-xl shadow-xl hover:border-amber-500/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Total Rewards Earned</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-extrabold text-white">${totalEarnings}</span>
              <span className="text-xs text-emerald-400 font-semibold ml-2">Lifetime Bonus</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Total referral bonuses credited to date</p>
          </motion.div>
        </div>
      </section>

      {/* REFERRAL CODE & SHARING SECTION */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-[#121212] border border-white/10 p-6 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Gift className="text-amber-400" size={28} />
                Your Shareable Referral Code
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Friends enter this code during signup to instantly unlock $25 ride credit.
              </p>
            </div>

            {/* Code Box */}
            <div className="w-full md:w-auto flex items-center gap-3 bg-black/60 border border-amber-500/40 rounded-2xl p-2.5 px-4 shadow-inner">
              <span className="text-xl md:text-2xl font-mono font-bold tracking-wider text-amber-400">
                {referralCode || "LOGIN REQUIRED"}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs md:text-sm transition active:scale-95 shadow-md"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Share Instantly With Friends:
            </span>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs md:text-sm font-semibold transition"
              >
                <Send size={16} />
                WhatsApp
              </button>
              <button
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs md:text-sm font-semibold transition"
              >
                <Share2 size={16} />
                X / Twitter
              </button>
              <button
                onClick={handleShareEmail}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 text-xs md:text-sm font-semibold transition"
              >
                <Mail size={16} />
                Email
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs md:text-sm font-semibold transition"
              >
                <Copy size={16} />
                Copy Link
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CLAIM REFERRAL CODE SECTION (For users who missed code at signup) */}
      {!hasBeenReferred && (
        <section className="px-4 md:px-8 max-w-5xl mx-auto py-6">
          <div className="rounded-3xl bg-neutral-900/80 border border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="text-amber-400" size={22} />
                Have a Referral Code? Claim $25 Signup Bonus!
              </h3>
              <p className="text-xs text-gray-400">
                If a friend invited you to Rydex and you didn't enter their code during signup, enter it below to receive your $25 credit bonus.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Enter Referral Code"
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value.toUpperCase())}
                className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-black border border-white/20 text-white placeholder-gray-500 outline-none focus:border-amber-500 uppercase tracking-wide font-mono text-sm"
              />
              <button
                onClick={handleClaimCode}
                disabled={claiming || !claimInput.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-sm transition"
              >
                {claiming ? "Claiming..." : "Claim Bonus"}
              </button>
            </div>
          </div>

          {claimMessage && (
            <div
              className={`mt-3 text-xs md:text-sm p-3 rounded-xl border ${
                claimMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {claimMessage.text}
            </div>
          )}
        </section>
      )}

      {/* HOW IT WORKS SECTION */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold text-white">How The Referral Program Works</h2>
          <p className="text-sm text-gray-400 mt-2">Earn unlimited credits in 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 relative">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-black text-lg flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold text-white">Share Your Link</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Copy your unique referral code or shareable invite link with your friends, family, and colleagues.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 relative">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-black text-lg flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold text-white">Friend Registers</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Your friend signs up on Rydex using your referral code and verifies their email address.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 relative">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-black font-black text-lg flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold text-white">Both Receive Credits</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              You automatically get <strong className="text-amber-400">$50</strong> credited to your wallet, and your friend gets <strong className="text-amber-400">$25</strong>!
            </p>
          </div>
        </div>
      </section>

      {/* REFERRAL LEADERBOARD SECTION */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase mb-3">
            <Trophy size={14} />
            Hall of Fame
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Top Referrers Leaderboard</h2>
          <p className="text-sm text-gray-400 mt-2">See who is driving community growth on Rydex</p>
        </div>

        {/* PODIUM DISPLAY FOR TOP 3 */}
        {leaderboard.length >= 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
            {/* Rank 2 (Silver) */}
            <div className="order-2 md:order-1 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/60 border border-slate-700/50 p-6 text-center shadow-xl">
              <div className="w-16 h-16 rounded-full bg-slate-700 text-slate-200 mx-auto flex items-center justify-center font-bold text-2xl mb-3 shadow-inner border-2 border-slate-400">
                2
              </div>
              <h4 className="font-bold text-white text-lg">{top2 ? top2.name : "Top Contributor"}</h4>
              <p className="text-xs text-slate-400">{top2 ? top2.maskedEmail : "---"}</p>
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-around text-xs">
                <div>
                  <span className="block text-slate-400">Invites</span>
                  <span className="font-bold text-white text-base">{top2?.referralCount || 0}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Earned</span>
                  <span className="font-bold text-slate-300 text-base">${top2?.totalReferralEarnings || 0}</span>
                </div>
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="order-1 md:order-2 rounded-2xl bg-gradient-to-b from-amber-500/20 via-neutral-900 to-black border-2 border-amber-500/60 p-8 text-center shadow-2xl relative scale-105">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <Crown size={32} className="text-amber-400 animate-bounce" />
              </div>
              <div className="w-20 h-20 rounded-full bg-amber-500 text-black mx-auto flex items-center justify-center font-black text-3xl mb-3 shadow-lg border-4 border-amber-300 mt-2">
                1
              </div>
              <h4 className="font-extrabold text-amber-400 text-xl">{top1 ? top1.name : "Champion Referrer"}</h4>
              <p className="text-xs text-gray-400">{top1 ? top1.maskedEmail : "---"}</p>
              <div className="mt-4 pt-4 border-t border-amber-500/20 flex justify-around text-xs">
                <div>
                  <span className="block text-gray-400">Invites</span>
                  <span className="font-extrabold text-amber-400 text-lg">{top1?.referralCount || 0}</span>
                </div>
                <div>
                  <span className="block text-gray-400">Total Credits</span>
                  <span className="font-extrabold text-amber-400 text-lg">${top1?.totalReferralEarnings || 0}</span>
                </div>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="order-3 rounded-2xl bg-gradient-to-b from-amber-900/40 to-neutral-900/60 border border-amber-800/40 p-6 text-center shadow-xl">
              <div className="w-16 h-16 rounded-full bg-amber-900/80 text-amber-300 mx-auto flex items-center justify-center font-bold text-2xl mb-3 shadow-inner border-2 border-amber-700">
                3
              </div>
              <h4 className="font-bold text-white text-lg">{top3 ? top3.name : "Rising Star"}</h4>
              <p className="text-xs text-gray-400">{top3 ? top3.maskedEmail : "---"}</p>
              <div className="mt-4 pt-3 border-t border-amber-900/40 flex justify-around text-xs">
                <div>
                  <span className="block text-gray-400">Invites</span>
                  <span className="font-bold text-white text-base">{top3?.referralCount || 0}</span>
                </div>
                <div>
                  <span className="block text-gray-400">Earned</span>
                  <span className="font-bold text-amber-300 text-base">${top3?.totalReferralEarnings || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD TABLE */}
        <div className="rounded-2xl bg-neutral-900/80 border border-white/10 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white text-lg">Global Rankings</h3>
            <span className="text-xs text-gray-400">Updated in Real-Time</span>
          </div>

          {loadingLeaderboard ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading leaderboard...</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No referral rankings yet. Be the first to invite friends and top the leaderboard!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/[0.02] text-xs uppercase text-gray-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3.5">Rank</th>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Friends Invited</th>
                    <th className="px-6 py-3.5 text-right">Total Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboard.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 font-bold">
                        {item.rank === 1 ? (
                          <span className="text-amber-400 font-black">#1 👑</span>
                        ) : item.rank === 2 ? (
                          <span className="text-slate-300 font-bold">#2 🥈</span>
                        ) : item.rank === 3 ? (
                          <span className="text-amber-600 font-bold">#3 🥉</span>
                        ) : (
                          <span className="text-gray-400">#{item.rank}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.maskedEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/10 text-gray-300">
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">{item.referralCount}</td>
                      <td className="px-6 py-4 text-right font-bold text-amber-400">
                        ${item.totalReferralEarnings}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* REFERRAL ACTIVITY HISTORY */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto py-8">
        <div className="rounded-2xl bg-neutral-900/80 border border-white/10 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-400" />
              Your Referral Activity History
            </h3>
            <span className="text-xs text-gray-400">{history.length} Refers Total</span>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              You haven't referred any friends yet. Share your code above to start earning!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/[0.02] text-xs uppercase text-gray-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3.5">Referred Friend</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Bonus Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{item.referredUser?.name || "Referred User"}</div>
                        <div className="text-xs text-gray-500">{item.referredUser?.emailMasked}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check size={12} />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-400">
                        +${item.referrerBonus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
