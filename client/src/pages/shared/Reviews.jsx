import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { collabApi, reviewApi } from '../../api/endpoints.js';
import { PageLoader, EmptyState, StarRating, Modal, StatusBadge } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate } from '../../utils/format.js';
import { IconCheck, IconHandshake } from '../../components/icons.jsx';

export default function Reviews() {
  const { user } = useAuth();
  const collabs = useAsync(() => collabApi.mine(), []);
  const reviews = useAsync(() => reviewApi.mine(), []);
  const [modal, setModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const complete = async (c) => {
    try {
      await collabApi.complete(c._id);
      toast.success('Marked complete');
      collabs.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitReview = async () => {
    setBusy(true);
    try {
      await reviewApi.create({ collaborationId: modal._id, rating, comment });
      toast.success('Review submitted');
      setModal(null);
      setComment('');
      setRating(5);
      collabs.reload();
      reviews.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const alreadyReviewed = (c) =>
    (user.role === 'company' && c.companyReviewed) || (user.role === 'creator' && c.creatorReviewed);

  if (collabs.loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Collaborations & Reviews</h1>

      <section>
        <h2 className="mb-3 font-semibold text-slate-800">Your Collaborations</h2>
        {collabs.data?.items?.length ? (
          <div className="space-y-3">
            {collabs.data.items.map((c) => {
              const partner = user.role === 'company' ? c.creator : c.company;
              return (
                <div key={c._id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{c.campaign?.title}</div>
                      <div className="text-xs text-slate-400">with {partner?.name} · {formatDate(c.createdAt)}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    {c.status === 'active' && (
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => complete(c)}>Mark Complete</button>
                    )}
                    {c.status === 'completed' && !alreadyReviewed(c) && (
                      <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setModal(c)}>Leave a Review</button>
                    )}
                    {c.status === 'completed' && alreadyReviewed(c) && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><IconCheck className="h-3.5 w-3.5" strokeWidth={3} /> You reviewed this</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={IconHandshake} title="No collaborations yet" subtitle="Accepted applications become collaborations you can review." />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-800">Reviews About You ({reviews.data?.received?.length || 0})</h2>
        {reviews.data?.received?.length ? (
          <div className="space-y-3">
            {reviews.data.received.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{r.author?.name}</span>
                  <StarRating value={r.rating} />
                </div>
                {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No reviews about you yet.</p>
        )}
      </section>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title="Leave a Review"
        footer={
          <>
            <button className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={submitReview} disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Rating</label>
            <StarRating value={rating} size={28} onChange={setRating} />
          </div>
          <div>
            <label className="label">Comment</label>
            <textarea className="input min-h-[100px]" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the collaboration?" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
