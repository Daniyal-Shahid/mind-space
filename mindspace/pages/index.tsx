import { Button } from "@heroui/button";
import Link from "next/link";

export default function Home() {
  // Hardcoded affirmation for demo purposes
  const dailyAffirmation = {
    quote:
      "I am capable of handling whatever comes my way today with strength and resilience.",
    author: "MindSpace",
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="text-center py-8 md:py-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          Welcome to MindSpace
        </h1>
        <p className="text-default-600 text-lg md:text-xl max-w-2xl mx-auto">
          Your personal sanctuary for mental wellness. Track your moods, journal
          your thoughts, and find daily inspiration.
        </p>
      </section>

      <section className="max-w-2xl mx-auto w-full">
        <div className="shadow-md border-none bg-gradient-to-r from-pastel-blue/20 to-pastel-purple/20 rounded-xl overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex gap-3">
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-default-700">
                  Daily Affirmation
                </h3>
                <p className="text-default-500 text-small">
                  Inspiration for today
                </p>
              </div>
            </div>
            <div className="py-4">
              <blockquote className="text-xl md:text-2xl font-medium text-default-700 italic py-3">
                &quot;{dailyAffirmation.quote}&quot;
              </blockquote>
              <div className="text-right text-default-500 mt-2">
                — {dailyAffirmation.author}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                as={Link}
                className="font-medium"
                color="primary"
                href="/affirmations"
                variant="flat"
              >
                More Affirmations
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full py-8">
        <FeatureCard
          colorClass="bg-pastel-blue/10"
          description="Track your daily moods to identify patterns and improve your mental well-being."
          href="/mood-tracker"
          title="Mood Tracker"
        />
        <FeatureCard
          colorClass="bg-pastel-purple/10"
          description="Express your thoughts and feelings in a safe, private space."
          href="/journal"
          title="Journal"
        />
        <FeatureCard
          colorClass="bg-pastel-green/10"
          description="Discover daily affirmations to boost your confidence and mindset."
          href="/affirmations"
          title="Affirmations"
        />
      </section>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  colorClass: string;
}

function FeatureCard({
  title,
  description,
  href,
  colorClass,
}: FeatureCardProps) {
  return (
    <div
      className={`shadow-sm border-none ${colorClass} hover:scale-105 transition-transform rounded-xl overflow-hidden`}
    >
      <div className="p-5">
        <h3 className="text-xl font-semibold text-default-700 mb-2">{title}</h3>
        <p className="text-default-600">{description}</p>
      </div>
      <div className="flex justify-end p-5 pt-0">
        <Button as={Link} color="primary" href={href} size="sm" variant="light">
          Explore
        </Button>
      </div>
    </div>
  );
}
