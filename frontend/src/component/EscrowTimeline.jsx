export default function EscrowTimeline({ timeline }) {
  return (
    <ul className="timeline">
      {timeline.map((t, i) => (
        <li key={i}>
          <strong>{t.action}</strong>
          <div>{new Date(t.date).toLocaleString()}</div>
        </li>
      ))}
    </ul>
  );
}
