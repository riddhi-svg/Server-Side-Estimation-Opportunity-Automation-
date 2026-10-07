import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Layers, Cpu, Gauge } from 'lucide-react';

export const GlossarySection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    {
      title: 'GTM Tag Classification Tiers',
      icon: <Layers className="w-4 h-4 text-emerald-600" />,
      items: [
        {
          name: 'Removable Client Libraries',
          badge: 'High Savings',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          desc: 'Marketing & advertising pixels (e.g. Meta Pixel, TikTok, Criteo) whose client-side JavaScript can be completely removed from the browser and executed server-side via sGTM / Conversions API.'
        },
        {
          name: 'Stays Client-Side (Lighter Payload)',
          badge: 'Lighter Payload',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          desc: 'Essential client tags (e.g. Google Analytics 4, Google Ads) that remain in the browser to collect events, but have their network transport redirected directly to your sGTM server domain.'
        },
        {
          name: 'DOM / Interactive',
          badge: 'Must Stay on Client',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          desc: 'Tags requiring direct DOM manipulation or live browser UI interaction (e.g. live chat widgets, visual heatmaps, A/B testing scripts, cookie consent managers) that cannot move server-side.'
        },
        {
          name: 'Obsolete Legacy Tags',
          badge: 'Delete from Container',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
          desc: 'Deprecated or sunset tracking tags (e.g. Universal Analytics analytics.js) that continue to execute and waste browser CPU cycles; should be deleted from the container.'
        }
      ]
    },
    {
      title: 'Attributed Browser Workload Metrics',
      icon: <Cpu className="w-4 h-4 text-indigo-600" />,
      items: [
        {
          name: 'Data Downloaded by Browser',
          badge: 'Network Transfer',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          desc: 'Total network payload size (in KB) transferred across the network to download tracking scripts and pixel libraries.'
        },
        {
          name: 'Browser Processing Time',
          badge: 'Main-Thread CPU',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          desc: 'Total CPU execution and compilation time spent on the browser’s single JavaScript main-thread by tracking scripts.'
        },
        {
          name: 'JavaScript Loading & Setup Time',
          badge: 'Bootup Time',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          desc: 'Initial script parsing, compilation, and top-level evaluation duration required before tag code becomes idle.'
        }
      ]
    },
    {
      title: 'Lighthouse Lab & Core Web Vitals Metrics',
      icon: <Gauge className="w-4 h-4 text-blue-600" />,
      items: [
        {
          name: 'First Contentful Paint (FCP)',
          badge: 'Lab Metric (10%)',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
          desc: 'Measures the time from page navigation until the browser renders the very first piece of DOM text, image, or canvas.'
        },
        {
          name: 'Speed Index (SI)',
          badge: 'Lab Metric (10%)',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
          desc: 'Measures how quickly page contents are visually populated during load (uses alpha factor relief heuristic).'
        },
        {
          name: 'Largest Contentful Paint (LCP)',
          badge: 'Core Web Vital (25%)',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          desc: 'Measures when the largest visible text block or hero image renders; primary metric for perceptual load speed.'
        },
        {
          name: 'Total Blocking Time (TBT)',
          badge: 'Lab Metric (30%)',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          desc: 'Measures the total amount of time between FCP and Time to Interactive where the CPU main thread was blocked by tasks over 50ms.'
        },
        {
          name: 'Interaction to Next Paint (INP)',
          badge: 'Core Web Vital (Field)',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          desc: 'Measures real-world page responsiveness to user clicks, taps, and keystrokes throughout the entire user session.'
        },
        {
          name: 'Cumulative Layout Shift (CLS)',
          badge: 'Core Web Vital (25%)',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          desc: 'Measures visual stability by quantifying unexpected layout shifts during page loading (not affected by tracking tags).'
        }
      ]
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs mt-6 transition">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Report Metrics & Classification Glossary</h3>
            <p className="text-xs text-slate-500">Definitions and explanations of all tiers, workload metrics, and Core Web Vitals</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
          <span>{isOpen ? 'Hide Glossary' : 'View Definitions'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-in fade-in duration-200">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                {cat.icon}
                {cat.title}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cat.items.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
