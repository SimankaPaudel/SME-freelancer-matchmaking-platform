import { useParams } from "react-router-dom";
import ChatWindow from "./ChatWindow";
import "./chat.css";

export default function ChatPage() {
  const { projectId } = useParams(); // ✅ Fixed: get from URL params, not prop

  return (
    <div className="chat-page">
      <h2>Project Communication</h2>
      {projectId ? (
        <ChatWindow projectId={projectId} />
      ) : (
        <p style={{ color: "#ef4444", padding: 20 }}>
          ⚠️ No project selected. Please navigate from a project page.
        </p>
      )}
    </div>
  );
}

