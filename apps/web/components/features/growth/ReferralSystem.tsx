import { Link2, Share2, UserPlus } from "lucide-react";
export function ReferralSystem() {
  return (
    <section className="referral-system glass-gold">
      <div className="business-panel-heading">
        <div>
          <span>BACKEND INTEGRATION REQUIRED</span>
          <h2>Referral system</h2>
        </div>
      </div>
      <div>
        <span>
          <Share2 size={18} />
          <strong>Share</strong>
          <small>Frontend concept</small>
        </span>
        <i>→</i>
        <span>
          <Link2 size={18} />
          <strong>Referral</strong>
          <small>Tracking unavailable</small>
        </span>
        <i>→</i>
        <span>
          <UserPlus size={18} />
          <strong>Registration</strong>
          <small>Attribution unavailable</small>
        </span>
      </div>
      <p>No referral code, attribution, or reward endpoint exists.</p>
    </section>
  );
}
