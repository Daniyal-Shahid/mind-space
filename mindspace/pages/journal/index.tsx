import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
}

// Sample journal entries
const sampleEntries: JournalEntry[] = [
  {
    id: "1",
    title: "A Moment of Gratitude",
    content:
      "Today I'm grateful for the small things: a warm cup of tea, a quiet moment, and the sunshine through my window.",
    date: "2023-07-15",
    tags: ["gratitude", "reflection"],
  },
  {
    id: "2",
    title: "Overcoming Challenges",
    content:
      "I faced a difficult situation at work today, but managed to stay calm and find a solution. Proud of how I handled it.",
    date: "2023-07-10",
    tags: ["work", "growth"],
  },
];

export default function Journal() {
  const [entries] = useState<JournalEntry[]>(sampleEntries);
  const [newEntry, setNewEntry] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-default-900 mb-4">
            My Journal
          </h1>
          <p className="text-default-600">
            Express your thoughts and feelings freely in your personal safe
            space.
          </p>
        </div>
        <Button
          className="font-medium"
          color="primary"
          onClick={() => setNewEntry(true)}
        >
          New Entry
        </Button>
      </section>

      {/* Journal entries */}
      <section className="grid grid-cols-1 gap-6">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-background/90 rounded-xl shadow-sm border border-default-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold text-default-800">
                {entry.title}
              </h3>
              <div className="text-default-400 text-sm">
                {new Date(entry.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            <p className="text-default-700 mb-4 line-clamp-3">
              {entry.content}
            </p>
            <div className="flex gap-2 flex-wrap">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-pastel-blue/20 text-primary font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* New entry form */}
      {newEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl shadow-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-semibold text-default-900 mb-4">
              New Journal Entry
            </h3>
            <form className="flex flex-col gap-4">
              <div>
                <Input
                  className="w-full"
                  label="Title"
                  placeholder="Give your entry a title"
                />
              </div>
              <div>
                <label className="block text-default-700 text-sm font-medium mb-1">
                  Content
                </label>
                <textarea
                  className="w-full h-48 p-3 rounded-lg border border-default-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-default-900"
                  placeholder="Write your thoughts here..."
                />
              </div>
              <div>
                <Input
                  className="w-full"
                  label="Tags (comma separated)"
                  placeholder="e.g. gratitude, work, reflection"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  color="default"
                  variant="flat"
                  onClick={() => setNewEntry(false)}
                >
                  Cancel
                </Button>
                <Button color="primary" onClick={() => setNewEntry(false)}>
                  Save Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
