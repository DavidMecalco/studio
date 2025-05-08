
import { db, isFirebaseProperlyConfigured } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, writeBatch, type CollectionReference, type DocumentData, limit } from 'firebase/firestore';

/**
 * Represents a GitHub commit.
 */
export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  url: string;
  date: string;
  filesChanged?: string[];
  ticketId?: string; // Local ticket ID
  branch?: string;
}

/**
 * Represents a specific version of a file.
 */
export interface FileVersion {
  id: string; 
  timestamp: string;
  commitSha: string;
  author: string;
  message?: string;
  fileName: string;
}

const TLA_GITLAB_API_KEY = 'glpat-m5wMBM1TQ3PSKXoRpPay';

let commitsCollectionRef: CollectionReference<DocumentData> | null = null;
const SERVICE_NAME = 'GitHubService';

if (db) { 
  commitsCollectionRef = collection(db, 'github_commits');
  console.log(`[SERVICE_INIT ${SERVICE_NAME}] Collection ref initialized (github_commits: ${!!commitsCollectionRef}) because db is available.`);
} else {
  console.warn(`[SERVICE_INIT ${SERVICE_NAME}] Firestore db instance is null. commitsCollectionRef not initialized. isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}`);
}

const MOCK_GITHUB_SEEDED_FLAG_V6 = 'mock_github_seeded_v6'; 
const LOCAL_STORAGE_GITHUB_KEY = 'firestore_mock_github_commits_cache_v6'; 

const getRandomPastDateISO = () => {
  const now = new Date();
  const randomDaysAgo = Math.floor(Math.random() * 30);
  now.setDate(now.getDate() - randomDaysAgo);
  return now.toISOString();
};

const commitsToSeed: GitHubCommit[] = [
    {
      sha: 'a1b2c3d4e5f6', message: 'Feat: Implement user authentication module', author: 'alice-wonderland',
      url: 'https://github.com/example/repo/commit/a1b2c3d4e5f6', date: getRandomPastDateISO(),
      filesChanged: ['auth.py', 'user_model.py'], ticketId: 'MAS-001', branch: 'dev' 
    },
    {
      sha: 'f6e5d4c3b2a1', message: 'Fix: Resolve issue in payment processing', author: 'bob-the-builder',
      url: 'https://github.com/example/repo/commit/f6e5d4c3b2a1', date: getRandomPastDateISO(),
      filesChanged: ['payment.js', 'checkout.xml'], ticketId: 'MAS-002', branch: 'main' 
    },
    {
      sha: 'c7g8h9i0j1k2', message: 'Chore: Update dependencies and configuration', author: 'admin',
      url: 'https://github.com/example/repo/commit/c7g8h9i0j1k2', date: getRandomPastDateISO(),
      branch: 'dev'
    },
    {
      sha: 'l3m4n5o6p7q8', message: 'Docs: Add API documentation for new endpoints', author: 'alice-wonderland',
      url: 'https://github.com/example/repo/commit/l3m4n5o6p7q8', date: getRandomPastDateISO(),
      branch: 'docs'
    },
    {
      sha: 'r9s0t1u2v3w4', message: 'Refactor: Optimize database query performance', author: 'bob-the-builder',
      url: 'https://github.com/example/repo/commit/r9s0t1u2v3w4',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      filesChanged: ['query_optimizer.sql'], ticketId: 'MAS-003', branch: 'perf-opt' 
    },
    {
      sha: 'x5y6z7a8b9c0', message: 'Style: Improve UI consistency across pages', author: 'admin',
      url: 'https://github.com/example/repo/commit/x5y6z7a8b9c0',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), branch: 'ui-fixes'
    }
];

async function ensureGitHubMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined') {
     if (!isFirebaseProperlyConfigured) {
         console.warn(`[${SERVICE_NAME}] Mock data seeding (server-side): Firebase not properly configured. Cannot seed to Firestore.`);
    }
    return;
  }

  const isSeededInLocalStorage = localStorage.getItem(MOCK_GITHUB_SEEDED_FLAG_V6) === 'true';

   if (isSeededInLocalStorage && isFirebaseProperlyConfigured && db && commitsCollectionRef) {
    try {
        const firstCommit = await getDoc(doc(commitsCollectionRef, commitsToSeed[0].sha));
        if (firstCommit.exists()) {
            // console.log(`[${SERVICE_NAME}] Mock data (v6) already confirmed in Firestore. Skipping further seeding checks.`);
            return;
        }
    } catch(e) {
        console.warn(`[${SERVICE_NAME}] Error checking Firestore seed status for GitHub commits. Will proceed with localStorage check and potential re-seed. Error:`, e);
    }
  }

  if (!isSeededInLocalStorage) {
    console.log(`[${SERVICE_NAME}] Attempting to seed GitHub mock data (v6) to localStorage...`);
    localStorage.setItem(LOCAL_STORAGE_GITHUB_KEY, JSON.stringify(commitsToSeed));
    localStorage.setItem(MOCK_GITHUB_SEEDED_FLAG_V6, 'true');
    console.log(`[${SERVICE_NAME}] GitHub mock data (v6) seeded to localStorage. Seeding flag set.`);
  }
  

  if (isFirebaseProperlyConfigured && db && navigator.onLine && commitsCollectionRef) {
    try {
      const firstCommitSnap = await getDoc(doc(commitsCollectionRef, commitsToSeed[0].sha));
      if (!firstCommitSnap.exists()) {
        const batch = writeBatch(db);
        console.log(`[${SERVICE_NAME}] Preparing to seed GitHub commits to Firestore (v6)...`);
        for (const commitData of commitsToSeed) {
          batch.set(doc(commitsCollectionRef, commitData.sha), commitData);
        }
        await batch.commit();
        console.log(`[${SERVICE_NAME}] Initial GitHub commits (v6) committed to Firestore.`);
      } else {
        // console.log(`[${SERVICE_NAME}] Firestore already contains key GitHub mock data (v6). Skipping Firestore GitHub seed.`);
      }
    } catch (error) {
      console.warn(`[${SERVICE_NAME}] Error during Firestore GitHub seeding (v6): `, error);
    }
  } else if (typeof window !== 'undefined'){
    let reason = "";
    if (!isFirebaseProperlyConfigured) reason += "Firebase not properly configured. ";
    else if (!db) reason += "Firestore db instance is null. ";
    else if (!commitsCollectionRef) reason += "commitsCollectionRef is null. ";
    else if (!navigator.onLine) reason += "Client is offline. ";
    // console.log(`[${SERVICE_NAME}] Skipping Firestore GitHub seeding (v6). ${reason}Will rely on localStorage if already seeded there.`);
  }
}


export async function getGitHubCommits(ticketIdOrProjectId: string): Promise<GitHubCommit[]> {
  await ensureGitHubMockDataSeeded();

  if (ticketIdOrProjectId === 'maximo-tla') {
    console.log(`[${SERVICE_NAME}] SIMULATING: If this were a real GitLab API call for TLA (repo: ${ticketIdOrProjectId}), the TLA GitLab API Key would be used: ${TLA_GITLAB_API_KEY.substring(0, 10)}...`);
  }


  if (isFirebaseProperlyConfigured && db && commitsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      // console.log(`[${SERVICE_NAME}] Fetching GitHub commits from Firestore for: ${ticketIdOrProjectId}`);
      let q;
      if (ticketIdOrProjectId === "ALL_PROJECTS") {
        q = query(commitsCollectionRef, orderBy("date", "desc"), limit(50)); 
      } else {
        if (ticketIdOrProjectId.includes('-')) { 
             q = query(commitsCollectionRef, where("ticketId", "==", ticketIdOrProjectId), orderBy("date", "desc"));
        } else { 
            q = query(commitsCollectionRef, where("ticketId", "==", `dummy-value-for-repo-${ticketIdOrProjectId}`), orderBy("date", "desc"));
        }
      }
      const querySnapshot = await getDocs(q);
      const commits: GitHubCommit[] = [];
      querySnapshot.forEach((docSnap) => {
        commits.push(docSnap.data() as GitHubCommit);
      });
       if (typeof window !== 'undefined') { 
        localStorage.setItem(LOCAL_STORAGE_GITHUB_KEY, JSON.stringify(
            ticketIdOrProjectId === "ALL_PROJECTS" ? 
            commits : 
            (JSON.parse(localStorage.getItem(LOCAL_STORAGE_GITHUB_KEY) || '[]') as GitHubCommit[]).filter(c => c.ticketId !== ticketIdOrProjectId && !c.message.includes(ticketIdOrProjectId) && !c.branch?.includes(ticketIdOrProjectId)).concat(commits)
        ));
      }
      return commits;
    } catch (error) {
      console.error(`[${SERVICE_NAME}] Error fetching GitHub commits for ${ticketIdOrProjectId} from Firestore. Falling back to localStorage (client-side). Error:`, error);
    }
  }

  if (typeof window !== 'undefined') {
    const storedCommits = localStorage.getItem(LOCAL_STORAGE_GITHUB_KEY);
    if (storedCommits) {
      try {
        console.warn(`[${SERVICE_NAME}] Fetching GitHub commits for ${ticketIdOrProjectId} from localStorage (Firestore unavailable or offline).`);
        let commits: GitHubCommit[] = JSON.parse(storedCommits);
        if (ticketIdOrProjectId !== "ALL_PROJECTS") {
          commits = commits.filter(commit => commit.ticketId === ticketIdOrProjectId || commit.message.includes(ticketIdOrProjectId) || commit.branch?.includes(ticketIdOrProjectId));
        }
        return commits.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (e) {
        console.error(`[${SERVICE_NAME}] Error parsing GitHub commits from localStorage. Error:`, e);
      }
    }
    console.warn(`[${SERVICE_NAME}] No GitHub commits found in localStorage cache for ${ticketIdOrProjectId}.`);
    return [];
  }
  console.warn(`[${SERVICE_NAME}] No GitHub commits found. (Server-side context and Firestore is unavailable/not configured for ${ticketIdOrProjectId}).`);
  return [];
}

export async function createGitHubCommit(
    ticketId: string,
    message: string,
    author: string,
    branch: string = 'dev',
    filesChanged: string[] = []
): Promise<GitHubCommit | null> {
  
  if (!isFirebaseProperlyConfigured || !db || !commitsCollectionRef) {
    console.error(
      `[${SERVICE_NAME}] (createGitHubCommit): Cannot create GitHub commit. `+
      `isFirebaseProperlyConfigured: ${isFirebaseProperlyConfigured}, db: ${!!db}, commitsCollectionRef: ${!!commitsCollectionRef}. ` +
      `Firebase not properly configured, or db/collection instance is null.`
    );
    return null;
  }

  let repoName = 'example/repo'; 
  if(ticketId.toUpperCase().startsWith('MAS-TLA') || ticketId.toUpperCase().includes('TLA')) repoName = 'maximo-tla';
  else if(ticketId.toUpperCase().startsWith('MAS-FEMA') || ticketId.toUpperCase().includes('FEMA')) repoName = 'maximo-fema';
  
  if (repoName === 'maximo-tla') {
    console.log(`[${SERVICE_NAME}] (createGitHubCommit): SIMULATING: If this were a real GitLab API call for TLA (repo: ${repoName}) to create a commit, the TLA GitLab API Key would be used: ${TLA_GITLAB_API_KEY.substring(0, 10)}...`);
  }
  
  try {
    const newSha = Math.random().toString(36).substring(2, 12);
    const fullMessage = `${ticketId}: ${message}`;
    
    const newCommit: GitHubCommit = {
        sha: newSha, message: fullMessage, author,
        url: `https://github.com/${repoName}/commit/${newSha}`, 
        date: new Date().toISOString(), filesChanged, ticketId, branch,
    };

    const commitDocRef = doc(commitsCollectionRef, newSha);
    await setDoc(commitDocRef, newCommit);
    console.log(`[${SERVICE_NAME}] (createGitHubCommit): GitHub commit ${newSha} created in Firestore.`);

    if (typeof window !== 'undefined') {
        const storedCommits = localStorage.getItem(LOCAL_STORAGE_GITHUB_KEY);
        let commits: GitHubCommit[] = storedCommits ? JSON.parse(storedCommits) : [];
        commits.unshift(newCommit);
        localStorage.setItem(LOCAL_STORAGE_GITHUB_KEY, JSON.stringify(commits));
        console.log(`[${SERVICE_NAME}] (createGitHubCommit): Local GitHub commit cache updated after Firestore create.`);
    }
    return newCommit;
  } catch (error) {
    console.error(`[${SERVICE_NAME}] (createGitHubCommit): Error creating GitHub commit in Firestore: `, error);
    return null;
  }
}


export async function getFileVersions(fileName: string): Promise<FileVersion[]> {
    await ensureGitHubMockDataSeeded();

    let relevantCommits: GitHubCommit[] = [];
    if (isFirebaseProperlyConfigured && db && commitsCollectionRef && (typeof navigator === 'undefined' || navigator.onLine)) {
        try {
            const q = query(commitsCollectionRef, where("filesChanged", "array-contains", fileName), orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(docSnap => relevantCommits.push(docSnap.data() as GitHubCommit));
        } catch (error) {
            console.error(`[${SERVICE_NAME}] Error fetching versions for ${fileName} from Firestore. Falling back to localStorage (client-side). Error:`, error);
        }
    }

    if (relevantCommits.length === 0 && typeof window !== 'undefined') { 
        const storedCommits = localStorage.getItem(LOCAL_STORAGE_GITHUB_KEY);
        if (storedCommits) {
            try {
                const allCommits: GitHubCommit[] = JSON.parse(storedCommits);
                relevantCommits = allCommits.filter(
                    commit => commit.filesChanged?.includes(fileName) || commit.message.includes(fileName)
                ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            } catch (e) { console.error(`[${SERVICE_NAME}] Error parsing localStorage commits for file versions. Error:`, e); }
        }
    }


    if (relevantCommits.length === 0) {
        console.warn(`[${SERVICE_NAME}] No specific commits found for ${fileName}, returning generic versions.`);
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
