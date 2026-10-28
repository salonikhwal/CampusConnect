import React, { useState } from 'react';

const CATEGORIES = [
  'All Questions',
  'Academics & Labs',
  'Skills & Projects',
  'Campus & Career',
];

export default function GuidanceFaqSection({ faqs, onAskAboutTopic }) {
  const [activeCategory, setActiveCategory] = useState('All Questions');
  const [expandedId, setExpandedId] = useState(null);

  const filteredFaqs = faqs.filter((faq) => {
    if (activeCategory === 'All Questions') return true;
    return faq.category === activeCategory;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/35 shadow-xs flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[22px]">
              forum
            </span>
            <span className="font-heading text-title-xs uppercase tracking-wider text-primary font-bold">
              Field-Tested Peer Advice
            </span>
          </div>
          <h2 className="font-heading text-headline-sm font-bold text-on-surface">
            Questions students often ask
          </h2>
          <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
            Archived advice and wisdom from MNIT CSE seniors to help you navigate labs, projects, and coursework.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-heading font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFaqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <div
              key={faq.id}
              className="bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl p-5 border border-outline-variant/25 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="bg-primary-container/20 text-primary font-heading text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border border-primary/20">
                    {faq.category}
                  </span>
                  {faq.topicTag && (
                    <span className="font-heading text-[11px] text-outline font-medium">
                      #{faq.topicTag}
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-title-sm font-bold text-on-surface leading-snug mb-2">
                  {faq.question}
                </h3>

                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed mb-3">
                  "{faq.answer}"
                </p>
              </div>

              <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-heading font-semibold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  <span>— {faq.seniorAuthor}</span>
                </span>

                {faq.topicTag && (
                  <button
                    onClick={() => onAskAboutTopic && onAskAboutTopic(faq.topicTag)}
                    className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary font-heading text-[11px] font-bold px-2 py-1 rounded-lg hover:bg-surface-container transition-all"
                    title={`Find seniors who help with ${faq.topicTag}`}
                  >
                    <span>Ask a senior about this</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
