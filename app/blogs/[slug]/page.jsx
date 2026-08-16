import Link from "next/link";
import { notFound } from "next/navigation";
import articles from "../articles";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getArticle = (slug) => articles.find((article) => article.slug === slug);

export async function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }) {
  const article = getArticle(params.slug);

  if (!article) {
    return {
      title: "Ballpitt Blog",
    };
  }

  return {
    title: `${article.title} | Ballpitt Blog`,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} | Ballpitt Blog`,
      description: article.excerpt,
      images: [
        {
          url: article.heroImage,
        },
      ],
    },
  };
}

const BodyBlock = ({ block }) => {
  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-[#D8D3FF] pl-6 italic text-[#4C4763] text-lg bg-[#F7F6FF] rounded-r-2xl py-4 px-2">
        {block.content}
      </blockquote>
    );
  }

  if (block.type === "list") {
    return (
      <div className="space-y-3">
        {block.heading ? (
          <h3 className="text-xl font-semibold text-[#1C1629]">
            {block.heading}
          </h3>
        ) : null}
        <ul className="space-y-2 list-disc list-inside text-[#4C4763]">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <p className="text-lg leading-relaxed text-[#4C4763]">{block.content}</p>
  );
};

export default function BlogArticlePage({ params }) {
  const article = getArticle(params.slug);

  if (!article) {
    notFound();
  }

  const moreArticles = articles
    .filter((item) => item.slug !== article.slug)
    .slice(0, 2);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B55FF]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to all articles
        </Link>

        <header className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap text-xs uppercase tracking-[0.4em] text-[#6D64F3]">
            {article.tags.map((tag) => (
              <span key={tag} className="tracking-[0.2em]">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl font-semibold text-[#1C1629] leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-[#6F6A7E]">
            <div className="flex flex-col">
              <span className="font-semibold text-[#1C1629]">
                {article.author}
              </span>
              <span>{article.role}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{formatDate(article.published)}</span>
              <span className="w-1 h-1 rounded-full bg-[#B9B4CA]" />
              <span>{article.readTime}</span>
            </div>
          </div>
        </header>

        <div className="w-full rounded-3xl overflow-hidden bg-[#F7F6FF]">
          <img
            src={article.heroImage}
            alt={article.title}
            className="w-full h-[360px] object-cover"
          />
        </div>

        <article className="space-y-6">
          {article.body.map((block, index) => (
            <BodyBlock key={`${article.slug}-${index}`} block={block} />
          ))}
        </article>
      </div>

      <section className="bg-[#F7F6FF] py-16">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#6D64F3]">
                More insights
              </p>
              <h2 className="text-2xl font-semibold text-[#1C1629]">
                Keep exploring digital sampling
              </h2>
            </div>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#E1DFFC] text-sm font-semibold text-[#5B55FF]"
            >
              View all
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {moreArticles.map((item) => (
              <Link
                key={item.slug}
                href={`/blogs/${item.slug}`}
                className="p-6 rounded-3xl bg-white border border-[#E6E3F5] shadow-[0px_10px_40px_rgba(20,10,60,0.05)] hover:-translate-y-1 transition-transform"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-[#6D64F3] mb-3">
                  {item.tags[0]}
                </p>
                <h3 className="text-xl font-semibold text-[#1C1629] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#6F6A7E] mb-4">{item.excerpt}</p>
                <div className="flex items-center gap-2 text-sm text-[#5B55FF] font-semibold">
                  Read next
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

