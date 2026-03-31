export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        Inventario ITS
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <a
          href="/assets"
          className="p-6 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600 transition"
        >
          Vai agli Asset
        </a>

        <div className="p-6 bg-gray-200 rounded-xl shadow">
          Dashboard in costruzione 🚧
        </div>
      </div>
    </main>
  );
}