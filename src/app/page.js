import DiscordChatComponent from "./components/DiscordChatComponent/DiscordChatComponent";

export default function Home() {
  return (
    <main className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Clock Crew</h1>
        <p className="hero-subtitle">Community Discord — Live Feed</p>
        <div style={{ marginTop: "32px", width: "100%", maxWidth: "820px" }}>
          <DiscordChatComponent messageCount={50} />
        </div>
      </div>
    </main>
  );
}
