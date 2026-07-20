"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import axios from "axios";

interface RatingModalProps {
  bookingId: string;
  targetName?: string;
  targetRole?: "driver" | "passenger";
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (rating: number) => void;
}

const DRIVER_TAGS = [
  "Safe Driver",
  "Punctual",
  "Clean Vehicle",
  "Polite & Friendly",
  "Great Navigation",
  "Smooth Ride",
];

const PASSENGER_TAGS = [
  "Polite Rider",
  "On Time",
  "Respectful",
  "Clean Passenger",
  "Quiet & Pleasant",
  "Easy Pickup",
];

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent!",
};

export default function RatingModal({
  bookingId,
  targetName = "Participant",
  targetRole = "driver",
  isOpen,
  onClose,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const availableTags = targetRole === "driver" ? DRIVER_TAGS : PASSENGER_TAGS;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    setError(null);

    try {
      await axios.post("/api/reviews", {
        bookingId,
        rating,
        feedbackTags: selectedTags,
        comment,
      });

      setSubmitted(true);
      if (onSuccess) onSuccess(rating);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeRating = hoverRating || rating;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-900 transition-colors"
          >
            <X size={20} />
          </button>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-bold text-white">Thank You!</h3>
              <p className="text-zinc-400 text-sm max-w-xs">
                Your feedback helps us build a safer and better experience for everyone.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center pt-2">
                <span className="text-xs font-semibold tracking-widest text-amber-400 uppercase">
                  Rate your {targetRole}
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  How was {targetName}?
                </h2>
                <p className="text-zinc-400 text-xs mt-1">
                  Tap a star to give your rating
                </p>
              </div>

              {/* Star Rating Selection */}
              <div className="flex flex-col items-center">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform active:scale-90 hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={36}
                        className={`transition-colors ${
                          star <= activeRating
                            ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            : "text-zinc-700 fill-zinc-800"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <motion.span
                  key={activeRating}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-bold text-amber-400 mt-2 h-5"
                >
                  {RATING_LABELS[activeRating] || ""}
                </motion.span>
              </div>

              {/* Feedback Tags */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-2">
                  What went well? (Optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const selected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selected
                            ? "bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-md"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment Text Area */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-zinc-400">
                    Additional Comments
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    {comment.length}/500
                  </span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Share details of your ride experience..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400/50 resize-none transition-colors"
                />
              </div>

              {/* Error Banner */}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-400 text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-amber-400/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Rating</span>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
