import { google, drive_v3 } from "googleapis";

export interface DriveFolderData {
  id: string;
  name: string;
  modifiedTime?: string;
  createdTime?: string;
}

export interface DriveVideoData {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  folderId: string;
}

export interface DriveScanResult {
  rootFolderId: string;
  folders: DriveFolderData[];
  videosByFolder: Record<string, DriveVideoData[]>;
  totalFiles: number;
  newStartPageToken?: string;
  authMethod: "service_account" | "oauth2" | "api_key" | "unconfigured";
}

export const DEFAULT_ROOT_FOLDER_ID = "1qDP0lUvRfyDsvktivuDTviwKxfi67W1i";

/**
 * Returns an authenticated Google Drive API v3 client if credentials exist,
 * otherwise null.
 */
export function getGoogleDriveClient(): {
  drive: drive_v3.Drive | null;
  authMethod: "service_account" | "oauth2" | "api_key" | "unconfigured";
} {
  // 1. Service Account JSON key string or path
  const saKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let saPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (saKeyJson) {
    try {
      const parsed = JSON.parse(saKeyJson);
      const auth = new google.auth.JWT({
        email: parsed.client_email,
        key: parsed.private_key,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      return { drive: google.drive({ version: "v3", auth }), authMethod: "service_account" };
    } catch (e) {
      console.warn("[googleDriveApi] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:", e);
    }
  }

  if (saEmail && saPrivateKey) {
    // Replace escaped newlines if passed in single-line env var
    saPrivateKey = saPrivateKey.replace(/\\n/g, "\n");
    const auth = new google.auth.JWT({
      email: saEmail,
      key: saPrivateKey,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    return { drive: google.drive({ version: "v3", auth }), authMethod: "service_account" };
  }

  // 2. OAuth2 Client Credentials & Refresh Token
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return { drive: google.drive({ version: "v3", auth: oauth2Client }), authMethod: "oauth2" };
  }

  // 3. API Key (Read-only for public folders)
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return { drive: google.drive({ version: "v3", auth: apiKey }), authMethod: "api_key" };
  }

  return { drive: null, authMethod: "unconfigured" };
}

/**
 * Exponential backoff retry wrapper for Google Drive API calls.
 */
export async function withDriveRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const status = err?.status || err?.code || 0;
      const isRateLimit = status === 429 || err?.message?.includes("User Rate Limit Exceeded");
      const isTransient = status >= 500 && status <= 504;

      if ((isRateLimit || isTransient) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`[googleDriveApi] Drive API call error ${status}, retrying in ${delay.toFixed(0)}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Lists all subfolders within a parent folder using Google Drive API v3.
 */
export async function fetchDriveSubfolders(
  drive: drive_v3.Drive,
  parentFolderId: string
): Promise<DriveFolderData[]> {
  const folders: DriveFolderData[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const currentToken: string | undefined = pageToken;
    const res: any = await withDriveRetry(() =>
      drive.files.list({
        q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "nextPageToken, files(id, name, modifiedTime, createdTime)",
        pageSize: 100,
        pageToken: currentToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      })
    );

    if (res.data?.files) {
      for (const f of res.data.files) {
        if (f.id && f.name) {
          folders.push({
            id: f.id,
            name: f.name.trim(),
            modifiedTime: f.modifiedTime ?? undefined,
            createdTime: f.createdTime ?? undefined,
          });
        }
      }
    }

    pageToken = res.data?.nextPageToken ?? undefined;
  } while (pageToken);

  return folders;
}

/**
 * Lists all video files within a specific folder using Google Drive API v3.
 */
export async function fetchDriveVideosInFolder(
  drive: drive_v3.Drive,
  folderId: string
): Promise<DriveVideoData[]> {
  const videos: DriveVideoData[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const currentToken: string | undefined = pageToken;
    const res: any = await withDriveRetry(() =>
      drive.files.list({
        q: `'${folderId}' in parents and trashed = false and (mimeType contains 'video/' or name contains '.mp4' or name contains '.mov' or name contains '.mkv' or name contains '.webm')`,
        fields: "nextPageToken, files(id, name, mimeType, size, webViewLink, thumbnailLink, createdTime, modifiedTime)",
        pageSize: 100,
        pageToken: currentToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      })
    );

    if (res.data.files) {
      for (const f of res.data.files) {
        if (f.id && f.name) {
          videos.push({
            id: f.id,
            name: f.name.trim(),
            mimeType: f.mimeType || "video/mp4",
            size: f.size ? Number(f.size) : 0,
            webViewLink: f.webViewLink ?? undefined,
            thumbnailLink: f.thumbnailLink ?? undefined,
            createdTime: f.createdTime ?? undefined,
            modifiedTime: f.modifiedTime ?? undefined,
            folderId,
          });
        }
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return videos;
}

/**
 * Performs a full scan of the configured Google Drive root folder.
 */
export async function scanFullGoogleDrive(
  rootFolderId: string = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID
): Promise<DriveScanResult> {
  const { drive, authMethod } = getGoogleDriveClient();

  if (!drive) {
    return {
      rootFolderId,
      folders: [],
      videosByFolder: {},
      totalFiles: 0,
      authMethod: "unconfigured",
    };
  }

  const folders = await fetchDriveSubfolders(drive, rootFolderId);
  const videosByFolder: Record<string, DriveVideoData[]> = {};
  let totalFiles = 0;

  for (const folder of folders) {
    const videos = await fetchDriveVideosInFolder(drive, folder.id);
    videosByFolder[folder.id] = videos;
    totalFiles += videos.length;
  }

  // Get start page token for future incremental syncs
  let newStartPageToken: string | undefined = undefined;
  try {
    const tokenRes = await drive.changes.getStartPageToken({ supportsAllDrives: true });
    newStartPageToken = tokenRes.data.startPageToken ?? undefined;
  } catch (err) {
    // Non-fatal if startPageToken cannot be retrieved
  }

  return {
    rootFolderId,
    folders,
    videosByFolder,
    totalFiles,
    newStartPageToken,
    authMethod,
  };
}
