import fs from "fs";
import path from "path";
import matter from "gray-matter";

const personalDirectory = path.join(process.cwd(), "content/personal");

export interface PersonalPostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export interface PersonalPost extends PersonalPostMeta {
  content: string;
}

export function getAllPersonalPosts(): PersonalPostMeta[] {
  if (!fs.existsSync(personalDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(personalDirectory);
  const allPosts = fileNames
    .filter((fileName) => fileName.endsWith(".mdx") || fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, "");
      const fullPath = path.join(personalDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        date: data.date || "",
        description: data.description || "",
      };
    });

  return allPosts.sort((a, b) => {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });
}

export function getPersonalPostBySlug(slug: string): PersonalPost | null {
  const mdxPath = path.join(personalDirectory, `${slug}.mdx`);
  const mdPath = path.join(personalDirectory, `${slug}.md`);

  let fullPath = "";
  if (fs.existsSync(mdxPath)) {
    fullPath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    fullPath = mdPath;
  } else {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    description: data.description || "",
    content,
  };
}

export function getAllPersonalPostSlugs(): string[] {
  if (!fs.existsSync(personalDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(personalDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".mdx") || fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.mdx?$/, ""));
}










