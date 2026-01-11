import './MagicCircle.css';

export const MagicCircle = ({ active }: { active: boolean; onComplete?: () => void }) => {
  if (!active) return null;

  return (
    <div className="magic-circle-overlay">
      <div className="magic-circle-container">
        <div className="magic-circle-spinner"></div>
        <div className="magic-text">GENERATING ZK PROOF...</div>
      </div>
    </div>
  );
};
