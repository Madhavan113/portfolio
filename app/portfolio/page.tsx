export const metadata = {
  title: "Portfolio - Madhavan Prasanna",
  description: "Selected projects and work",
};

interface Project {
  title: string;
  description: string;
  tags: string[];
  link?: string;
}

const projects: Project[] = [
  // Add your projects here
  // {
  //   title: "Project Name",
  //   description: "Brief description of what the project does.",
  //   tags: ["Python", "Machine Learning"],
  //   link: "https://github.com/username/project"
  // },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="max-w-2xl text-charcoal/72">
          Projects, experiments, and systems I have spent time building.
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-charcoal/10 bg-white/55 px-5 py-4">
          <p className="text-charcoal/68">
            Projects coming soon. In the meantime, check out my{" "}
            <a
              href="https://github.com/Madhavan113"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-charcoal underline"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project, index) => (
            <article
              key={index}
              className="rounded-2xl border border-charcoal/10 bg-white/55 px-5 py-4 transition-colors hover:border-charcoal/20 hover:bg-white/72"
            >
              <h2 className="font-bold text-lg">
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold transition-colors"
                  >
                    {project.title} →
                  </a>
                ) : (
                  project.title
                )}
              </h2>
              <p className="mt-2 text-charcoal/74">{project.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-charcoal/8 px-2.5 py-1 text-xs text-charcoal/72"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

