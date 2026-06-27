export default function StatusText({ status }) {
  const className = status.type ? `status ${status.type}` : "status";
  return (
    <span className={className} aria-live="polite">
      {status.message}
    </span>
  );
}
