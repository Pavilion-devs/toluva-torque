import React from "react";

const guideLinks = [
  "State of Checkout Report 2024",
  "Guide to Billing Models",
  "Platform Payments Architecture",
];

function ArrowIcon({ className = "" }) {
  return (
    <iconify-icon
      icon="solar:arrow-right-linear"
      width={16}
      classname={className}
      data-aura-component-name="CaseStudies"
    />
  );
}

function FeaturedStoryCard() {
  return (
    <a
      href="#"
      className="group relative block aspect-square overflow-hidden rounded-2xl bg-[#0a2540] transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 md:aspect-[4/3]"
      data-aura-component-name="CaseStudyCard"
    >
      <img
        src="https://images.stripeassets.com/fzn2n1nzq965/1hreJwxuVJ5ucPtuA7pRKH/3c5630387bca898d01ae17fc7ae2890a/decagon.png?w=864&q=90"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-luminosity transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
        data-aura-component-name="CaseStudyCard"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0a2540] via-[#0a2540]/50 to-transparent opacity-90"
        data-aura-component-name="CaseStudyCard"
      />
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 text-white" data-aura-component-name="CaseStudyCard">
        <h4 className="mb-4 text-xl font-medium leading-tight" data-aura-component-name="CaseStudyCard">
          Decagon decreases support costs by 20% with Stripe-integrated agents.
        </h4>
        <div
          className="flex items-center gap-1 text-sm font-medium transition-colors group-hover:text-indigo-400"
          data-aura-component-name="CaseStudyCard"
        >
          Read Decagon's story
          <ArrowIcon className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </a>
  );
}

function ResourceCard() {
  return (
    <div
      className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-[#f8f9fa] p-8"
      data-aura-component-name="CaseStudies"
    >
      <div>
        <div
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm"
          data-aura-component-name="CaseStudies"
        >
          <iconify-icon
            icon="solar:document-text-bold"
            width={24}
            classname="text-indigo-600"
            data-aura-component-name="CaseStudies"
          />
        </div>
        <h4 className="mb-4 text-xl font-medium text-[#0a2540]" data-aura-component-name="CaseStudies">
          Read our latest research and guides
        </h4>
        <p className="mb-8 text-[#424770]" data-aura-component-name="CaseStudies">
          Explore comprehensive documentation, implementation guides, and industry insights built by our engineering and product teams.
        </p>
      </div>
      <div className="space-y-4 border-t border-gray-200 pt-6" data-aura-component-name="CaseStudies">
        {guideLinks.map((label) => (
          <a
            key={label}
            href="#"
            className="group flex min-h-10 items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            data-aura-component-name="CaseStudies"
          >
            <span
              className="text-sm font-medium text-[#0a2540] transition-colors group-hover:text-indigo-600"
              data-aura-component-name="CaseStudies"
            >
              {label}
            </span>
            <ArrowIcon className="text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-indigo-600" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function CaseStudies() {
  return (
    <section className="bg-white px-page-margin py-24" data-aura-component-name="CaseStudies">
      <div className="mx-auto max-w-[1200px]" data-aura-component-name="CaseStudies">
        <h2 className="mb-10 text-2xl font-medium tracking-tight text-[#0a2540]" data-aura-component-name="CaseStudies">
          Build a foundation
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2" data-aura-component-name="CaseStudies">
          <FeaturedStoryCard />
          <ResourceCard />
        </div>
      </div>
    </section>
  );
}
