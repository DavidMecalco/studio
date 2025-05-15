
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

const MOCK_GITHUB_SEEDED_FLAG_V7 = 'mock_github_seeded_v7'; // Incremented version
const LOCAL_STORAGE_GITHUB_KEY = 'firestore_mock_github_commits_cache_v7'; // Incremented version

const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

const commitsToSeed: GitHubCommit[] = [
    {
      sha: 'a1b2c3d4e5f6', message: 'MAS-001: Feat: Implementar dashboard de cliente TLA', author: 'admin',
      url: 'https://github.com/example/repo/commit/a1b2c3d4e5f6', date: getDateDaysAgo(2),
      filesChanged: ['dashboard_tla.tsx', 'data_service_tla.ts'], ticketId: 'MAS-001', branch: 'feat/tla-dashboard' 
    },
    {
      sha: 'f6e5d4c3b2a1', message: 'MAS-002: Fix: Corregir cálculo en reporte financiero FEMA', author: 'alice-wonderland',
      url: 'https://github.com/example/repo/commit/f6e5d4c3b2a1', date: getDateDaysAgo(1),
      filesChanged: ['report_fema.py', 'test_report_fema.py'], ticketId: 'MAS-002', branch: 'fix/fema-report-calc' 
    },
    {
      sha: 'c7g8h9i0j1k2', message: 'Chore: Actualizar dependencias de CI', author: 'dave-grohl',
      url: 'https://github.com/example/repo/commit/c7g8h9i0j1k2', date: getDateDaysAgo(3),
      branch: 'devops', filesChanged: ['package.json', 'Jenkinsfile']
    },
    {
      sha: 'l3m4n5o6p7q8', message: 'MAS-004: Hotfix: Resolver error crítico API OtherCompany', author: 'bob-the-builder',
      url: 'https://github.com/example/repo/commit/l3m4n5o6p7q8', date: getDateDaysAgo(0),
      branch: 'hotfix/othercompany-api', filesChanged: ['integration_other_company.java'], ticketId: 'MAS-004'
    },
    {
      sha: 'r9s0t1u2v3w4', message: 'MAS-005: Refactor: Optimizar queries en GovSector', author: 'carol-danvers',
      url: 'https://github.com/example/repo/commit/r9s0t1u2v3w4',
      date: getDateDaysAgo(8),
      filesChanged: ['govsector_queries.sql', 'report_builder.py'], ticketId: 'MAS-005', branch: 'perf/govsector-db' 
    },
    {
      sha: 'x5y6z7a8b9c0', message: 'MAS-007: Style: Ajustar estilos de login TLA', author: 'admin',
      url: 'https://github.com/example/repo/commit/x5y6z7a8b9c0',
      date: getDateDaysAgo(4), branch: 'fix/tla-login-style', filesChanged: ['login.css', 'auth_tla.tsx'], ticketId: 'MAS-007'
    },
    {
      sha: '0a9b8c7d6e5f', message: 'MAS-001: Feat: Agregar paginación a tabla de tickets TLA', author: 'admin',
      url: 'https://github.com/example/repo/commit/0a9b8c7d6e5f', date: getDateDaysAgo(1),
      filesChanged: ['ticket_table_tla.tsx'], ticketId: 'MAS-001', branch: 'feat/tla-dashboard'
    },
    {
      sha: '1f2e3d4c5b6a', message: 'MAS-002: Test: Cobertura de pruebas para cálculo FEMA', author: 'alice-wonderland',
      url: 'https://github.com/example/repo/commit/1f2e3d4c5b6a', date: getDateDaysAgo(0),
      filesChanged: ['test_report_fema_edge_cases.py'], ticketId: 'MAS-002', branch: 'fix/fema-report-calc'
    }
];

async function ensureGitHubMockDataSeeded(): Promise<void> {
  if (typeof window === 'undefined') {
     if (!isFirebaseProperlyConfigured) {
         console.warn(`[${SERVICE_NAME}] Mock data seeding (server-side): Firebase not properly configured. Cannot seed to Firestore.`);
    }
    return;
  }

  const isSeededInLocalStorage = localStorage.getItem(MOCK_GITHUB_SEEDED_FLAG_V7) === 'true';

   if (isSeededInLocalStorage && isFirebaseProperlyConfigured && db && commitsCollectionRef) {
    try {
        const firstCommit = await getDoc(doc(commitsCollectionRef, commitsToSeed[0].sha));
        if (firstCommit.exists()) {
            // console.log(`[${SERVICE_NAME}] Mock data (v7) already confirmed in Firestore. Skipping further seeding checks.`);
            return;
        }
    } catch(e) {
        console.warn(`[${SERVICE_NAME}] Error checking Firestore seed status for GitHub commits. Will proceed with localStorage check and potential re-seed. Error:`, e);
    }
  }

  if (!isSeededInLocalStorage) {
    console.log(`[${SERVICE_NAME}] Attempting to seed GitHub mock data (v7) to localStorage...`);
    localStorage.setItem(LOCAL_STORAGE_GITHUB_KEY, JSON.stringify(commitsToSeed));
    localStorage.setItem(MOCK_GITHUB_SEEDED_FLAG_V7, 'true');
    console.log(`[${SERVICE_NAME}] GitHub mock data (v7) seeded to localStorage. Seeding flag set.`);
  }
  

  if (isFirebaseProperlyConfigured && db && navigator.onLine && commitsCollectionRef) {
    try {
      const firstCommitSnap = await getDoc(doc(commitsCollectionRef, commitsToSeed[0].sha));
      if (!firstCommitSnap.exists()) {
        const batch = writeBatch(db);
        console.log(`[${SERVICE_NAME}] Preparing to seed GitHub commits to Firestore (v7)...`);
        for (const commitData of commitsToSeed) {
          batch.set(doc(commitsCollectionRef, commitData.sha), commitData);
        }
        await batch.commit();
        console.log(`[${SERVICE_NAME}] Initial GitHub commits (v7) committed to Firestore.`);
      } else {
        // console.log(`[${SERVICE_NAME}] Firestore already contains key GitHub mock data (v7). Skipping Firestore GitHub seed.`);
      }
    } catch (error) {
      console.warn(`[${SERVICE_NAME}] Error during Firestore GitHub seeding (v7): `, error);
    }
  } else if (typeof window !== 'undefined'){
    let reason = "";
    if (!isFirebaseProperlyConfigured) reason += "Firebase not properly configured. ";
    else if (!db) reason += "Firestore db instance is null. ";
    else if (!commitsCollectionRef) reason += "commitsCollectionRef is null. ";
    else if (!navigator.onLine) reason += "Client is offline. ";
    // console.log(`[${SERVICE_NAME}] Skipping Firestore GitHub seeding (v7). ${reason}Will rely on localStorage if already seeded there.`);
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
        // Assuming ticketIdOrProjectId is a ticket ID if it contains '-', otherwise it's a project/repo ID
        if (ticketIdOrProjectId.includes('-')) { 
             q = query(commitsCollectionRef, where("ticketId", "==", ticketIdOrProjectId), orderBy("date", "desc"));
        } else { 
            // This is a simplification. In a real app, you'd query by a project/repo field.
            // For mock, we'll filter by messages or branch containing the project ID.
            // This part is tricky with Firestore unless commits have a dedicated 'projectId' field.
            // For now, this query might return 0 if no ticketId matches and it's not "ALL_PROJECTS".
            // Local filtering below will handle non-ticketId cases.
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
          // Filter by ticketId OR if message/branch contains the ID (as a fallback for project ID search)
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
