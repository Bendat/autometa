/**
 * Secure credential storage for testrail-cucumber CLI.
 *
 * Credentials are stored in a JSON file inside the user's home directory:
 *   $HOME/.config/autometa/testrail-credentials.json (macOS/Linux)
 *   %APPDATA%\autometa\testrail-credentials.json (Windows)
 *
 * The file is created with mode 0o600 (user read/write only).
 */
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export interface StoredCredentials {
  /** TestRail base URL (e.g. https://testrail.example.com) */
  url: string;
  /** TestRail username */
  username: string;
  /** TestRail password or API key */
  password: string;
  /** Default project ID (optional) */
  projectId?: number;
}

function getCredentialsDir(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "autometa");
  }
  // macOS / Linux follow XDG conventions
  const configHome = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(configHome, "autometa");
}

function getCredentialsPath(): string {
  return path.join(getCredentialsDir(), "testrail-credentials.json");
}

/**
 * Load stored credentials from disk if available.
 * Returns undefined if no credentials file exists or is malformed.
 */
export async function loadStoredCredentials(): Promise<StoredCredentials | undefined> {
  const filePath = getCredentialsPath();

  try {
    const text = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(text) as unknown;

    if (
      typeof data === "object" &&
      data !== null &&
      "url" in data &&
      "username" in data &&
      "password" in data &&
      typeof (data as StoredCredentials).url === "string" &&
      typeof (data as StoredCredentials).username === "string" &&
      typeof (data as StoredCredentials).password === "string"
    ) {
      return data as StoredCredentials;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Persist credentials to disk with secure file permissions.
 */
export async function saveCredentials(credentials: StoredCredentials): Promise<void> {
  const dir = getCredentialsDir();
  const filePath = getCredentialsPath();

  await fs.mkdir(dir, { recursive: true, mode: 0o700 });

  const text = JSON.stringify(credentials, null, 2);
  await fs.writeFile(filePath, text, { encoding: "utf8", mode: 0o600 });
}

/**
 * Remove stored credentials.
 */
export async function clearCredentials(): Promise<boolean> {
  const filePath = getCredentialsPath();

  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Return the file path where credentials are stored (for informational purposes).
 */
export function getCredentialsFilePath(): string {
  return getCredentialsPath();
}
