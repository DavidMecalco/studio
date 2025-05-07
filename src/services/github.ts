/**
 * Represents a GitHub commit.
 */
export interface GitHubCommit {
  /**
   * The SHA of the commit.
   */
  sha: string;
  /**
   * The message of the commit.
   */
  message: string;
  /**
   * The author of the commit.
   */
  author: string;
  /**
   * The URL of the commit.
   */
  url: string;
  /**
   * The date of the commit in ISO string format.
   */
  date: string;
}

// Helper to generate a date within the last month
const getRandomPastDateISO = () => {
  const now = new Date();
  const randomDaysAgo = Math.floor(Math.random() * 30); // 0 to 29 days ago
  now.setDate(now.getDate() - randomDaysAgo);
  return now.toISOString();
};


const mockCommits: GitHubCommit[] = [
  {
    sha: 'a1b2c3d4e5f6',
    message: 'Feat: Implement user authentication module',
    author: 'Alice Wonderland',
    url: 'https://github.com/example/repo/commit/a1b2c3d4e5f6',
    date: getRandomPastDateISO(),
  },
  {
    sha: 'f6e5d4c3b2a1',
    message: 'Fix: Resolve issue in payment processing',
    author: 'Bob The Builder',
    url: 'https://github.com/example/repo/commit/f6e5d4c3b2a1',
    date: getRandomPastDateISO(),
  },
  {
    sha: 'c7g8h9i0j1k2',
    message: 'Chore: Update dependencies and configuration',
    author: 'Charlie Brown',
    url: 'https://github.com/example/repo/commit/c7g8h9i0j1k2',
    date: getRandomPastDateISO(),
  },
  {
    sha: 'l3m4n5o6p7q8',
    message: 'Docs: Add API documentation for new endpoints',
    author: 'Diana Prince',
    url: 'https://github.com/example/repo/commit/l3m4n5o6p7q8',
    date: getRandomPastDateISO(),
  },
  {
    sha: 'r9s0t1u2v3w4',
    message: 'Refactor: Optimize database query performance',
    author: 'Edward Scissorhands',
    url: 'https://github.com/example/repo/commit/r9s0t1u2v3w4',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    sha: 'x5y6z7a8b9c0',
    message: 'Style: Improve UI consistency across pages',
    author: 'Fiona Gallagher',
    url: 'https://github.com/example/repo/commit/x5y6z7a8b9c0',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  }
];


/**
 * Asynchronously retrieves GitHub commits.
 * If ticketId is "ALL_PROJECTS", it returns a general list of recent commits.
 * Otherwise, it returns commits related to a specific ticketId (mocked).
 * @param ticketId The ID of the Jira ticket, or "ALL_PROJECTS".
 * @returns A promise that resolves to an array of GitHubCommit objects.
 */
export async function getGitHubCommits(ticketId: string): Promise<GitHubCommit[]> {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay

  if (ticketId === "ALL_PROJECTS") {
    return JSON.parse(JSON.stringify(mockCommits));
  }

  // Mock specific commits for a ticketId
  const ticketSpecificCommits = mockCommits.filter((_, index) => {
    // Simple hashing of ticketId to get a somewhat consistent subset
    const hash = ticketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash + index) % 3 === 0; // Return roughly 1/3 of commits for any given ticketId
  }).slice(0, 3); // Max 3 commits per ticket

  if (ticketSpecificCommits.length === 0 && mockCommits.length > 0) {
     // Ensure at least one commit if possible, for demo
    return [JSON.parse(JSON.stringify(mockCommits[Math.floor(Math.random() * mockCommits.length)]))];
  }
  
  return JSON.parse(JSON.stringify(ticketSpecificCommits));
}
