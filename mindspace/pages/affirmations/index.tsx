import { useState } from "react";
import { Button } from "@heroui/button";

interface Affirmation {
  id: string;
  text: string;
  category: string;
  isFavorite: boolean;
}

// Sample affirmations
const sampleAffirmations: Affirmation[] = [
  {
    id: "1",
    text: "I am capable of making positive changes in my life.",
    category: "confidence",
    isFavorite: true,
  },
  {
    id: "2",
    text: "I choose to focus on what I can control and let go of what I cannot.",
    category: "peace",
    isFavorite: false,
  },
  {
    id: "3",
    text: "I am worthy of love and respect, both from myself and others.",
    category: "self-love",
    isFavorite: true,
  },
  {
    id: "4",
    text: "Every day I am growing and evolving into a better version of myself.",
    category: "growth",
    isFavorite: false,
  },
  {
    id: "5",
    text: "I have the strength to overcome any challenges that come my way.",
    category: "resilience",
    isFavorite: false,
  },
  {
    id: "6",
    text: "I am grateful for everything I have in my life right now.",
    category: "gratitude",
    isFavorite: true,
  },
  {
    id: "7",
    text: "My thoughts and feelings are valid, and I deserve to express them.",
    category: "self-expression",
    isFavorite: false,
  },
  {
    id: "8",
    text: "I release all negative thoughts and welcome positivity into my life.",
    category: "positivity",
    isFavorite: false,
  },
];

// Categories with pastel colors
const categories = [
  { name: "All", color: "bg-default-100" },
  { name: "confidence", color: "bg-pastel-blue" },
  { name: "peace", color: "bg-pastel-green" },
  { name: "self-love", color: "bg-pastel-pink" },
  { name: "growth", color: "bg-pastel-purple" },
  { name: "resilience", color: "bg-pastel-orange" },
  { name: "gratitude", color: "bg-pastel-yellow" },
  { name: "self-expression", color: "bg-pastel-blue" },
  { name: "positivity", color: "bg-pastel-green" },
];

export default function Affirmations() {
  const [affirmations, setAffirmations] =
    useState<Affirmation[]>(sampleAffirmations);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Toggle favorite state
  const toggleFavorite = (id: string) => {
    setAffirmations(
      affirmations.map((affirmation) =>
        affirmation.id === id
          ? { ...affirmation, isFavorite: !affirmation.isFavorite }
          : affirmation,
      ),
    );
  };

  // Filter affirmations by selected category
  const filteredAffirmations =
    selectedCategory === "All"
      ? affirmations
      : affirmations.filter(
          (affirmation) =>
            affirmation.category === selectedCategory.toLowerCase(),
        );

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-default-900 mb-4">
          Daily Affirmations
        </h1>
        <p className="text-default-600">
          Positive statements to inspire and motivate you each day. Save your
          favorites for quick access.
        </p>
      </section>

      {/* Categories */}
      <section className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category.name}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.name
                  ? `${category.color} text-default-900`
                  : "bg-default-100 text-default-700 hover:bg-default-200"
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name === "All"
                ? category.name
                : category.name.charAt(0).toUpperCase() +
                  category.name.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Daily featured affirmation */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 text-center">
        <h2 className="text-lg font-medium text-default-700 mb-3">
          Today's Affirmation
        </h2>
        <blockquote className="text-2xl md:text-3xl font-medium text-default-900 italic max-w-2xl mx-auto mb-6">
          "I am exactly where I need to be on my journey, and I trust the
          process of life."
        </blockquote>
        <Button className="mx-auto" color="primary" variant="flat">
          Set as Reminder
        </Button>
      </section>

      {/* Affirmations grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAffirmations.map((affirmation) => {
          // Find category object to get color
          const categoryObj = categories.find(
            (c) => c.name === affirmation.category,
          );
          const categoryColor = categoryObj
            ? categoryObj.color
            : "bg-default-100";

          return (
            <div
              key={affirmation.id}
              className="rounded-xl overflow-hidden shadow-sm border border-default-200 hover:shadow-md transition-shadow"
            >
              <div className={`${categoryColor}/20 p-5`}>
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${categoryColor}/30 text-default-700 font-medium`}
                  >
                    {affirmation.category.charAt(0).toUpperCase() +
                      affirmation.category.slice(1)}
                  </span>
                  <button
                    className="text-pastel-pink"
                    onClick={() => toggleFavorite(affirmation.id)}
                  >
                    {affirmation.isFavorite ? (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-5.201-3.41 12.856 12.856 0 01-2.176-2.816c-.5-.882-.908-1.828-1.208-2.829-.3-1-.45-2.056-.45-3.138 0-1.5.3-2.9.9-4.1.6-1.2 1.5-2.2 2.6-2.9 1.1-.7 2.3-1 3.6-1 1 0 1.9.2 2.8.5.9.3 1.7.8 2.4 1.4.7-.6 1.5-1.1 2.4-1.4.9-.3 1.8-.5 2.8-.5 1.3 0 2.5.3 3.6 1 1.1.7 2 1.7 2.6 2.9.6 1.2.9 2.6.9 4.1 0 1.082-.15 2.137-.45 3.138-.3 1-.708 1.947-1.208 2.83a12.86 12.86 0 01-2.176 2.815 15.247 15.247 0 01-5.201 3.41l-.022.012-.007.003-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-lg text-default-800 font-medium">
                  {affirmation.text}
                </p>
              </div>
              <div className="bg-background p-3 flex justify-end">
                <Button color="primary" size="sm" variant="light">
                  Share
                </Button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
