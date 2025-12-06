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
    <div>
      <h1 className="text-2xl font-bold mb-8">Portfolio</h1>

      {projects.length === 0 ? (
        <p className="text-charcoal/60">
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
      ) : (
        <div className="space-y-8">
          {projects.map((project, index) => (
            <article
              key={index}
              className="border-b border-charcoal/10 pb-6 last:border-0"
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
              <p className="mt-2 text-charcoal/80">{project.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-charcoal/10 px-2 py-1 rounded"
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

