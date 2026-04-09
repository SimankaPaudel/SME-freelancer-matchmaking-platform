export default function SingleMessage({ message, onReply }) {
  let currentUserId = null;

  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      currentUserId = JSON.parse(atob(token.split(".")[1])).userId;
    }
  } catch {
    // invalid token — ignore
  }

  if (!message) return null;

  const isMine = message?.senderId?._id === currentUserId;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`message-bubble ${isMine ? "mine" : "theirs"}`}>
      {!isMine && (
        <div className="sender">{message.senderId?.fullName || "Unknown"}</div>
      )}

      {message.replyTo && (
        <div className="reply-context">
          ↩{" "}
          <em>{message.replyTo.content || "[File]"}</em>
        </div>
      )}

      {message.content && <p className="msg-text">{message.content}</p>}

      {message.file?.path && (
        <a
          className="msg-file"
          href={`http://localhost:5000/${message.file.path}`}
          target="_blank"
          rel="noreferrer"
        >
          [File] {message.file.fileName || "Download file"}
        </a>
      )}

      <div className="message-footer">
        <button
          className="reply-btn"
          onClick={() => onReply?.(message)}
          title="Reply"
        >
          ↩ Reply
        </button>
        <span className="time">{time}</span>
      </div>
    </div>
  );
}

