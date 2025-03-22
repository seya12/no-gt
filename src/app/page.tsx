import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome to No-GT</h1>
      <p className="text-xl text-gray-600">Not only a Gym Tracker</p>
      <p className="mt-4 text-gray-500">Track your gym sessions, exercises, and progress</p>
    </main>
  );
}
