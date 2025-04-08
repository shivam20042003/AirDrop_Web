export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen text-center gap-6">
      <h1 className="text-4xl font-bold">AirDrop for Web 📂⚡</h1>
      <p className="text-lg">No sign-up. No cloud. Just drop a file and share a link.</p>
      <div className="flex gap-4">
        <a href="/send" className="px-4 py-2 bg-blue-600 text-white rounded-xl">Send File</a>
        <a href="/receive" className="px-4 py-2 bg-green-600 text-white rounded-xl">Receive File</a>
      </div>
    </main>
  );
}