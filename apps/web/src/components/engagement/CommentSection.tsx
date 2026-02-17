"use client";

import { useState, useEffect, useCallback } from "react";
import { engagementClient } from "@/lib/engagement-client";
import { isAuthenticated, getUser } from "@/lib/auth";
import type { Comment } from "@/types";

export function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(
    async (p: number) => {
      setLoading(true);
      const res = await engagementClient.getComments(postId, p);
      setComments(res.items || []);
      setTotal(res.total);
      setPage(p);
      setLoading(false);
    },
    [postId],
  );

  useEffect(() => {
    loadComments(1);
  }, [loadComments]);

  return (
    <div className="mt-12" id="comments">
      <h3 className="text-xl font-bold text-gray-900">
        Komentar {total > 0 && <span className="text-gray-400">({total})</span>}
      </h3>

      {/* Comment Form */}
      <CommentForm postId={postId} onCommentPosted={() => loadComments(1)} />

      {/* Comments List */}
      <div className="mt-8 space-y-6">
        {loading && comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Memuat komentar...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Belum ada komentar. Jadilah yang pertama berkomentar!
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={postId}
              onReply={() => loadComments(page)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => loadComments(page - 1)}
            disabled={page <= 1}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="flex items-center px-3 text-sm text-gray-500">
            Halaman {page}
          </span>
          <button
            onClick={() => loadComments(page + 1)}
            disabled={page * 20 >= total}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}

function CommentForm({
  postId,
  parentId,
  onCommentPosted,
  onCancel,
}: {
  postId: string;
  parentId?: string;
  onCommentPosted: () => void;
  onCancel?: () => void;
}) {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setUser(getUser());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setError("");
    setLoading(true);
    try {
      await engagementClient.createComment(postId, {
        body: body.trim(),
        author_name: authed ? undefined : authorName,
        author_email: authed ? undefined : authorEmail,
        parent_id: parentId,
      });
      setBody("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onCommentPosted();
    } catch (err: any) {
      setError(err.message || "Gagal mengirim komentar");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-600">
          {authed
            ? "Komentar berhasil dikirim!"
            : "Komentar dikirim dan menunggu moderasi."}
        </div>
      )}

      {!authed && (
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Nama Anda"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
          />
          <input
            type="email"
            required
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            placeholder="Email (tidak ditampilkan)"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
          />
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          authed
            ? `Komentar sebagai ${user?.name || "Anda"}...`
            : "Tulis komentar..."
        }
        rows={3}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none"
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Mengirim..." : "Kirim Komentar"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  postId,
  onReply,
}: {
  comment: Comment;
  postId: string;
  onReply: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID");
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        {comment.user_id ? (
          <a
            href={`/u/${comment.user_id}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-200"
          >
            {comment.author_name.charAt(0).toUpperCase()}
          </a>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
            {comment.author_name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {comment.user_id ? (
              <a
                href={`/u/${comment.user_id}`}
                className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {comment.author_name}
              </a>
            ) : (
              <span className="text-sm font-semibold text-gray-900">
                {comment.author_name}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {timeAgo(comment.created_at)}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
            {comment.body}
          </p>

          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs font-medium text-gray-400 hover:text-indigo-600"
            >
              Balas
            </button>
            {(comment.reply_count ?? 0) > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs font-medium text-indigo-500 hover:text-indigo-600"
              >
                {showReplies
                  ? "Sembunyikan"
                  : `Lihat ${comment.reply_count} balasan`}
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReply && (
            <div className="mt-3 pl-3 border-l-2 border-indigo-100">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCommentPosted={() => {
                  setShowReply(false);
                  onReply();
                }}
                onCancel={() => setShowReply(false)}
              />
            </div>
          )}

          {/* Replies preview */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-3 border-l-2 border-gray-100">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
