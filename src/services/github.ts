
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
   * This will now be empty as files are not passed from the form.
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

// Store mock data globally within this module so it's generated once
let mockCommits: GitHubCommit[] = [];
let mockCommitsInitialized = false;

function initializeMockCommits() {
  if (mockCommitsInitialized) return;

  mockCommits = [
    {
      sha: 'a1b2c3d4e5f6',
      message: 'Feat: Implement user authentication module',
      author: 'Alice Wonderland',
      url: 'https://github.com/example/repo/commit/a1b2c3d4e5f6',
      date: getRandomPastDateISO(),
      filesChanged: ['auth.py', 'user_model.py'], // Keep for existing mock data
    },
    {
      sha: 'f6e5d4c3b2a1',
      message: 'Fix: Resolve issue in payment processing',
      author: 'Bob The Builder',
      url: 'https://github.com/example/repo/commit/f6e5d4c3b2a1',
      date: getRandomPastDateISO(),
      filesChanged: ['payment.js', 'checkout.xml'], // Keep for existing mock data
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
      filesChanged: ['query_optimizer.sql'], // Keep for existing mock data
    },
    {
      sha: 'x5y6z7a8b9c0',
      message: 'Style: Improve UI consistency across pages',
      author: 'Fiona Gallagher',
      url: 'https://github.com/example/repo/commit/x5y6z7a8b9c0',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    }
  ];
  mockCommitsInitialized = true;
}

initializeMockCommits();


/**
 * Asynchronously retrieves GitHub commits.
 * If ticketId is "ALL_PROJECTS", it returns a general list of recent commits.
 * Otherwise, it returns commits related to a specific ticketId (mocked).
 * @param ticketId The ID of the Jira ticket, or "ALL_PROJECTS".
 * @returns A promise that resolves to an array of GitHubCommit objects.
 */
export async function getGitHubCommits(ticketId: string): Promise<GitHubCommit[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Minimal delay

  if (ticketId === "ALL_PROJECTS") {
    const generalCommits = mockCommits.filter(commit => !commit.message.startsWith("MAX-") && !commit.message.startsWith("MAS-"));
    return JSON.parse(JSON.stringify(generalCommits.length > 0 ? generalCommits : mockCommits));
  }

  const ticketSpecificCommits = mockCommits.filter(commit => commit.message.startsWith(ticketId));
  return JSON.parse(JSON.stringify(ticketSpecificCommits));
}


/**
 * Simulates creating a new GitHub commit.
 * @param ticketId The ID of the Jira ticket to associate the commit with.
 * @param message The commit message (without the ticket ID prefix).
 * @param author The author of the commit.
 * @param branch The branch to commit to (simulated).
 * @returns A promise that resolves to the created GitHubCommit object.
 */
export async function createGitHubCommit(
    ticketId: string, 
    message: string, 
    author: string, 
    // fileNames?: string[], // Removed fileNames parameter
    branch: string = 'dev' 
): Promise<GitHubCommit> {
    await new Promise(resolve => setTimeout(resolve, 100)); 

    const newSha = Math.random().toString(36).substring(2, 12); 
    const fullMessage = `${ticketId}: ${message}`;
    
    const repoName = ticketId.startsWith('MAX-TLA') || ticketId.includes('-TLA') ? 'maximo-tla' : 
                     ticketId.startsWith('MAX-FEMA') || ticketId.includes('-FEMA') ? 'maximo-fema' : 'example/repo';

    const newCommit: GitHubCommit = {
        sha: newSha,
        message: fullMessage,
        author: author,
        url: `https://github.com/${repoName}/commit/${newSha}`, 
        date: new Date().toISOString(),
        filesChanged: [], // filesChanged is now an empty array as files are not passed
    };

    mockCommits.unshift(newCommit); 
    console.log(`Simulated commit to ${branch} branch:`, newCommit);
    return JSON.parse(JSON.stringify(newCommit));
}


/**
 * Simulates fetching version history for a file.
 * @param fileName The name of the file.
 * @returns A promise that resolves to an array of FileVersion objects.
 */
export async function getFileVersions(fileName: string): Promise<FileVersion[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const relevantCommits = mockCommits.filter(
      commit => commit.filesChanged?.includes(fileName) || commit.message.includes(fileName)
    );

    if (relevantCommits.length === 0) {
        // Return some generic versions if no specific commits are found
        const baseTimestamp = Date.now();
        return [
            { id: 'v3.0-' + fileName.substring(0,3), timestamp: new Date(baseTimestamp - 1 * 24 * 60 * 60 * 1000).toISOString(), commitSha: 'sha-abc123', author: 'Admin User', message: `Update ${fileName}`, fileName },
            { id: 'v2.1-' + fileName.substring(0,3), timestamp: new Date(baseTimestamp - 3 * 24 * 60 * 60 * 1000).toISOString(), commitSha: 'sha-def456', author: 'Dev Team', message: `Refactor ${fileName}`, fileName },
            { id: 'v1.0-' + fileName.substring(0,3), timestamp: new Date(baseTimestamp - 7 * 24 * 60 * 60 * 1000).toISOString(), commitSha: 'sha-ghi789', author: 'Initial Committer', message: `Initial version of ${fileName}`, fileName },
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return relevantCommits.map(commit => ({
        id: commit.sha.substring(0, 7), 
        timestamp: commit.date,
        commitSha: commit.sha,
        author: commit.author,
        message: commit.message,
        fileName: fileName,
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
