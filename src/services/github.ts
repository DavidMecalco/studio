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
  /**
   * Optional: Files changed in the commit.
   */
  filesChanged?: string[];
}

/**
 * Represents a specific version of a file.
 */
export interface FileVersion {
  id: string; // Could be commit SHA or a version number
  timestamp: string;
  commitSha: string;
  author: string;
  message?: string;
  fileName: string;
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
    filesChanged: ['auth.py', 'user_model.py'],
  },
  {
    sha: 'f6e5d4c3b2a1',
    message: 'Fix: Resolve issue in payment processing',
    author: 'Bob The Builder',
    url: 'https://github.com/example/repo/commit/f6e5d4c3b2a1',
    date: getRandomPastDateISO(),
    filesChanged: ['payment.js', 'checkout.xml'],
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
    filesChanged: ['query_optimizer.sql'],
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
    // Filter out commits that don't match the expected pattern for ticket-specific commits
    const generalCommits = mockCommits.filter(commit => !commit.message.startsWith("MAX-") && !commit.message.startsWith("MAS-"));
    return JSON.parse(JSON.stringify(generalCommits.length > 0 ? generalCommits : mockCommits));
  }

  // Mock specific commits for a ticketId (those that start with the ticketId in their message)
  const ticketSpecificCommits = mockCommits.filter(commit => commit.message.startsWith(ticketId));
  
  return JSON.parse(JSON.stringify(ticketSpecificCommits));
}


/**
 * Simulates creating a new GitHub commit.
 * @param ticketId The ID of the Jira ticket to associate the commit with.
 * @param message The commit message (without the ticket ID prefix).
 * @param author The author of the commit.
 * @param fileNames Optional array of filenames changed.
 * @param branch The branch to commit to (simulated).
 * @returns A promise that resolves to the created GitHubCommit object.
 */
export async function createGitHubCommit(
    ticketId: string, 
    message: string, 
    author: string, 
    fileNames?: string[],
    branch: string = 'dev' // Default branch
): Promise<GitHubCommit> {
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay

    const newSha = Math.random().toString(36).substring(2, 12); // Generate a random SHA
    const fullMessage = `${ticketId}: ${message}`;
    
    // Find the repository URL based on the ticket prefix or other logic if needed
    // For simplicity, let's assume a base URL.
    const repoName = ticketId.startsWith('MAX-TLA') || ticketId.includes('-TLA') ? 'maximo-tla' : 
                     ticketId.startsWith('MAX-FEMA') || ticketId.includes('-FEMA') ? 'maximo-fema' : 'example/repo';

    const newCommit: GitHubCommit = {
        sha: newSha,
        message: fullMessage,
        author: author,
        url: `https://github.com/${repoName}/commit/${newSha}`, // Mock URL
        date: new Date().toISOString(),
        filesChanged: fileNames,
    };

    mockCommits.unshift(newCommit); // Add to the beginning of the array
    console.log(`Simulated commit to ${branch} branch:`, newCommit);
    return JSON.parse(JSON.stringify(newCommit));
}


/**
 * Simulates fetching version history for a file.
 * In a real scenario, this would query GitLab/GitHub for commits affecting this file.
 * @param fileName The name of the file.
 * @returns A promise that resolves to an array of FileVersion objects.
 */
export async function getFileVersions(fileName: string): Promise<FileVersion[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Find all commits that mention this file (simplified simulation)
    const relevantCommits = mockCommits.filter(
      commit => commit.filesChanged?.includes(fileName) || commit.message.includes(fileName)
    );

    if (relevantCommits.length === 0) {
        // If no specific commits, return some generic versions for demo
        return [
            { id: 'v3.0', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), commitSha: 'sha-abc123', author: 'Admin User', message: `Update ${fileName}`, fileName },
            { id: 'v2.1', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), commitSha: 'sha-def456', author: 'Dev Team', message: `Refactor ${fileName}`, fileName },
            { id: 'v1.0', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), commitSha: 'sha-ghi789', author: 'Initial Committer', message: `Initial version of ${fileName}`, fileName },
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return relevantCommits.map(commit => ({
        id: commit.sha.substring(0, 7), // Use short SHA as version ID
        timestamp: commit.date,
        commitSha: commit.sha,
        author: commit.author,
        message: commit.message,
        fileName: fileName,
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
