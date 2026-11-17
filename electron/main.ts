import { app, BrowserWindow, ipcMain, dialog, protocol, safeStorage } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { createRequire } from "module";
import type { DatabaseSync as SQLiteDatabaseSync } from "node:sqlite";

const requireNode = createRequire(import.meta.url);
const { DatabaseSync } = requireNode("node:sqlite");

// Register the custom mbtiles scheme as privileged before app is ready
protocol.registerSchemesAsPrivileged([
	{
		scheme: "mbtiles",
		privileges: {
			bypassCSP: true,
			secure: true,
			supportFetchAPI: true,
			corsEnabled: true,
			stream: true,
		},
	},
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main.js
// │ └─┬ preload.js
// ├─┬ dist
// │ └── index.html

process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
	? path.join(process.env.APP_ROOT, "public")
	: RENDERER_DIST;

let win: BrowserWindow | null;

async function createWindow() {
	win = new BrowserWindow({
		width: 1280,
		height: 800,
		icon: path.join(process.env.VITE_PUBLIC, "logo.png"),
		webPreferences: {
			preload: path.join(
				__dirname,
				fs.existsSync(path.join(__dirname, "preload.mjs")) ? "preload.mjs" : "preload.js",
			),
			nodeIntegration: true,
			contextIsolation: true,
		},
	});

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		// win.loadFile('dist/index.html')
		win.loadFile(path.join(RENDERER_DIST, "index.html"));
	}
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// --------- IPC Database Handlers for 100% Offline Storage ---------
const getDataPath = () => {
	const userData = app.getPath("userData");
	if (!fs.existsSync(userData)) {
		fs.mkdirSync(userData, { recursive: true });
	}
	return path.join(userData, "data.json");
};

ipcMain.handle("db:get-data", () => {
	try {
		const filePath = getDataPath();
		if (!fs.existsSync(filePath)) {
			console.log("Offline database file does not exist yet. Path:", filePath);
			return null;
		}
		const data = fs.readFileSync(filePath, "utf-8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading offline database:", error);
		return null;
	}
});

ipcMain.handle("db:save-data", (_event, newData) => {
	try {
		const filePath = getDataPath();
		fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), "utf-8");
		return true;
	} catch (error) {
		console.error("Error writing to offline database:", error);
		throw error;
	}
});

ipcMain.on("db:log-debug", (_event, logData) => {
	try {
		const logPath = path.join(app.getPath("userData"), "debug_log.txt");
		fs.appendFileSync(
			logPath,
			`[${new Date().toISOString()}] ${JSON.stringify(logData, null, 2)}\n`,
		);
	} catch (err) {
		console.error("Failed to write debug log:", err);
	}
});

// --------- 100% Offline MBTiles Database and Custom Protocol Setup ---------
let mbtilesDb: SQLiteDatabaseSync | null = null;
let mbtilesStmt: any = null;

const getMbtilesPath = () => {
	const userData = app.getPath("userData");
	if (!fs.existsSync(userData)) {
		fs.mkdirSync(userData, { recursive: true });
	}
	return path.join(userData, "phuongbinhminh.mbtiles");
};

const initMbtilesDb = (filePath: string): boolean => {
	try {
		if (mbtilesDb) {
			mbtilesDb.close();
			mbtilesDb = null;
			mbtilesStmt = null;
		}

		if (fs.existsSync(filePath)) {
			mbtilesDb = new DatabaseSync(filePath, { readOnly: true });
			mbtilesStmt = mbtilesDb.prepare(
				"SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?",
			);
			console.log("[Offline Map] Opened MBTiles SQLite database successfully at:", filePath);
			return true;
		} else {
			console.warn("[Offline Map] MBTiles file not found at:", filePath);
			return false;
		}
	} catch (err) {
		console.error("[Offline Map] Failed to open MBTiles SQLite database:", err);
		return false;
	}
};

const setupMbtilesFile = () => {
	const targetPath = getMbtilesPath();

	const defaultMbtilesPath = app.isPackaged
		? path.join(process.resourcesPath, "phuongbinhminh.mbtiles")
		: path.join(process.env.APP_ROOT, "phuongbinhminh.mbtiles");

	if (fs.existsSync(targetPath)) {
		// In dev mode, automatically sync if the project's base mbtiles file was updated/expanded
		if (!app.isPackaged && fs.existsSync(defaultMbtilesPath)) {
			try {
				const targetStat = fs.statSync(targetPath);
				const defaultStat = fs.statSync(defaultMbtilesPath);
				if (
					defaultStat.mtimeMs > targetStat.mtimeMs &&
					defaultStat.size !== targetStat.size
				) {
					console.log(
						"[Offline Map] Newer project MBTiles detected in dev mode. Syncing to userData...",
					);
					fs.copyFileSync(defaultMbtilesPath, targetPath);
				}
			} catch (syncErr) {
				console.warn("[Offline Map] Could not compare/sync dev MBTiles:", syncErr);
			}
		}
		console.log("[Offline Map] Found active MBTiles file in userData:", targetPath);
		initMbtilesDb(targetPath);
		return;
	}

	console.log("[Offline Map] Default packaged MBTiles path:", defaultMbtilesPath);

	if (fs.existsSync(defaultMbtilesPath)) {
		try {
			console.log("[Offline Map] Copying default packaged MBTiles file to userData...");
			fs.copyFileSync(defaultMbtilesPath, targetPath);
			console.log("[Offline Map] Successfully copied default MBTiles to:", targetPath);
			initMbtilesDb(targetPath);
		} catch (err) {
			console.error(
				"[Offline Map] Failed to copy default MBTiles file, loading directly:",
				err,
			);
			initMbtilesDb(defaultMbtilesPath);
		}
	} else {
		console.warn(
			"[Offline Map] Default MBTiles file not found in package. Map will be empty until uploaded.",
		);
	}
};

const registerMbtilesProtocol = () => {
	protocol.handle("mbtiles", async (request) => {
		try {
			const url = new URL(request.url);

			// Use robust regex matching /z/x/y anywhere in the URL path
			// This supports mbtiles://tiles/{z}/{x}/{y} as well as mbtiles:///{z}/{x}/{y}
			const match = url.pathname.match(/\/(\d+)\/(\d+)\/(\d+)/);
			if (match) {
				const z = parseInt(match[1], 10);
				const x = parseInt(match[2], 10);
				const y = parseInt(match[3], 10);

				// Convert Y coordinate from standard XYZ/slippy layout to Y-flipped TMS layout required by MBTiles
				const tmsY = Math.pow(2, z) - 1 - y;

				if (mbtilesStmt) {
					const row = mbtilesStmt.get(z, x, tmsY) as { tile_data: Buffer } | undefined;
					if (row && row.tile_data) {
						return new Response(row.tile_data as any, {
							headers: {
								"Content-Type": "image/png",
								"Access-Control-Allow-Origin": "*",
							},
						});
					}
				}
			}
		} catch (err) {
			console.error("[Offline Map Protocol] Error serving mbtiles tile:", err);
		}

		// Standard response for empty tiles is 204 No Content
		return new Response(null, { status: 204 });
	});
};

// Quiet fallback to avoid console log clutter when local tile server is not active
ipcMain.handle("get-tile-server-port", () => {
	return null;
});

// Getter to check the status of the offline map file
ipcMain.handle("get-map-status", () => {
	const targetPath = getMbtilesPath();
	const exists = fs.existsSync(targetPath);
	let sizeBytes = 0;
	let modifiedTime = null;
	if (exists) {
		const stats = fs.statSync(targetPath);
		sizeBytes = stats.size;
		modifiedTime = stats.mtime;
	}
	return {
		exists,
		path: targetPath,
		sizeBytes,
		modifiedTime,
		isLoaded: mbtilesDb !== null,
	};
});

ipcMain.handle("db:update-map", async () => {
	try {
		const result = await dialog.showOpenDialog(win || undefined, {
			title: "Chọn tệp bản đồ (.mbtiles) mới",
			filters: [{ name: "Bản đồ MBTiles", extensions: ["mbtiles"] }],
			properties: ["openFile"],
		});

		if (result.canceled || result.filePaths.length === 0) {
			return { success: false, reason: "cancelled" };
		}

		const newFilePath = result.filePaths[0];
		const targetPath = getMbtilesPath();

		console.log("[Offline Map Update] Closing current SQLite connection...");
		if (mbtilesDb) {
			mbtilesDb.close();
			mbtilesDb = null;
			mbtilesStmt = null;
		}

		console.log(`[Offline Map Update] Copying ${newFilePath} to ${targetPath}...`);
		fs.copyFileSync(newFilePath, targetPath);
		console.log("[Offline Map Update] Copy finished. Re-opening SQLite connection...");

		const initSuccess = initMbtilesDb(targetPath);

		if (initSuccess) {
			console.log("[Offline Map Update] Successfully updated map database!");
			appendAuditLog(
				"MAP_UPDATED",
				"info",
				currentSessionUser || "Chủ quản",
				`Cập nhật tệp bản đồ nền ngoại tuyến mới (${path.basename(newFilePath)})`,
			);
			return { success: true, path: targetPath };
		} else {
			return { success: false, reason: "failed_to_initialize" };
		}
	} catch (error: any) {
		console.error("[Offline Map Update] Error updating map:", error);
		// Attempt to recover the database connection just in case
		setupMbtilesFile();
		return { success: false, reason: error.message || "unknown_error" };
	}
});

// --------- 100% Offline Single-Account Auth Vault & System Audit History ---------
const MAX_FAILED_ATTEMPTS = 5;
const MAX_AUDIT_LOGS = 5000;
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Asymmetric RSA-2048 OAEP escrow parameters (public key + scrypt-wrapped private key; zero plaintext secret)
const ESCROW_PUB_B64 =
	"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsF++pqrIP5cQ3S7Hhb2Sq8YNqbbmA9JaN3JW3uerMGtjBG0NM2DG346IRNDAagIBdkYBcOzxrvhXIWaw1eJfn5hVPvh/o8563JZoHx/8ky3okDd4rYM65nOq6kvF1dZD2wsmREKo07n9MesFN26kK2Rl/U3UQe36FOXlbUzKkXkq5Xre4z48PQ6PuBctLoYH6fEj3RaQsY5ebymxNs05WxM81hQHcVlENZAF47xhMe7UkLun8FiScvLjop1CdAbSDSHPwCghzLbShCTOgoxVcUT9PM2nk0nIRdsd7vru8PFvhrOQG9uLWOE3FDYO2J2YNbFMlJU79gr0+uvpXxSmjwIDAQAB";
const MASTER_KDF_SALT_B64 = "zTOC2DCB4oBWgUCxqKaMww==";
const MASTER_VERIFIER_B64 = "7+s16q1SF5IqM3i6aTqWVxChGrGopGj8wfzbfxNcRQ0=";
const MASTER_PRIV_IV_B64 = "0U10lUkAcumSg+Ii";
const MASTER_PRIV_TAG_B64 = "RwMVo5EPJJ/cpjd+KXsgtg==";
const MASTER_ENC_PRIV_B64 =
	"NebydqY2dlkXo6XeskkSpi3+qXnUAhxyW+diSP6rayeNLFZVNqEMOnWYFxIVktwQ75tSSbvOvVtaoI38zJqdV9RNWYVcBDXh3m0uXyIr6onb1FtsXVID1d+XW9R/iSAy99pMW7mVanIYndHmRdcszrrff6HufNCx1Fjt5xJT3BwSg2iODsgadee2xf+MK29dgyDepHkZQGf6G5F7sDv5qn1MGqOrDuJ1nMYfkVBuKj5cjZ6pffgYR4zUTeOH51letShjmFMz0DJ84AoyGPZEXbfZaCErQ0Z4Lr0NWtfTlPprjKJTgl1kQYlj4Ozm1tPlfhDWUJ2RHMbykz+APbDSjW3lcy20MahDbluHXQbQenOGBfXR6tTmXgRKDq9hMswKxn4g2wA+4eVhPc6aIEp/hNAmvT0uwc/vL4BcqdRZpjMnk5MkguBswMyyFgyEX7VguotCb1BwLruihyR71xLxeBJ4XOkRYNWuqNPTxABTBh5ILKhiNxuI0UpVPBujSaJpU2ZXiLIZlpuEFasjX4aYGssu+Yog+TlNLGyP6Obv5T/JbnTpaFXnVt9mBM/NrjX2J6Gg+Q8eqp0DfPsomQR/2+TryPHvAE9G89l9wI47oW710mE86NogTPzcj0h7J1oQd57h+n+xV73unHsI2wqlDg5bXHE2zWfPg7wJnEuqeW+HlVDqlXb6nJArfuKLLaPsobkTD6I9cFDrjyrnUzTRgKilZzF9vo4PSgRC0ICPtPszF+VzZPNl/3tuDl1APDTsvKPs6Zxahurs2+i+/1uEZiy/NYwvQq4fEan1AusABJpnUUrqjk1ie5vVcMsYbe2xJvOwvLh42bEbgNnyH9nGNeEEwjuGSBqip3SnVt1uPlMA7XYN3F6UZX3r7QLeLfsDBnwGZT4iq8OPumbJUsKtq+KgcaH/fbVtyGtRyGXX0QSF9gOmeLm03rSB8x7bko4ndhKqcbFz7gkuMP82t9K0DVIz1v1phVUQijNHjMs/NKdlWkcBQyyHYPCVlFKVBkd0iVvSgQYoAPvo4GKaVrrk9p8DbtDKwEwl2QfZRlW6Fun4xOnprA66re4ZGmVTwoy6RJ5BuxHaM5/BIe0zMvwQzOYm7/qlhkchhlFN57xaXgsqW7Qa2K7I7yKOJgQzpewO9F5aOmCQyP5JNP47d874+mwVMi5gTTsXoGk/jwaL7vmareWsvYWS87/8DDF4YVv1cSf3wdo3uEAowwyxvRfe9m0KdJyladtDK/JScawvLmS0fBQeAO333M9QRNHHpIX7bF93VWmwHjTOhg8S8oIzVd4ATdu/BJ+Bd7Ed24LF7WZVPmf42KtVErtptgXkwHya++TkJjlKQjcUGlGXHD+FXOW89U4qpr8QP6MfkTDabOOi5FUlaEc2TDiUJaO+AkuVBdiCLlM5YwisQfxmCkRGCoN68d9vgmk24INHHceGwL8bCnXmoWE938thDNt5rZFGyaHRRMENrmwdVwfp3nRzbaDa1sn5bk6oerbSwpCVYQFL9jYAZ4WtcOfp79vz8BBZoLG0zVIxq+1LwAYZpG2DbiKk3CPAC2LrflZFITf71NMwwI8g9gqbAXnfmvPmniigG4nqjGEyubMKaiK7qG6M7Ykf";

interface StoredAccount {
	username: string;
	passwordSalt: string;
	passwordHash: string;
	recoverySalt: string;
	recoveryHash: string;
	escrowBlob?: string;
	failedAttempts: number;
	isLocked: boolean;
	lockedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

interface SystemAuditLog {
	id: string;
	timestamp: string;
	eventType:
		| "INIT_ACCOUNT"
		| "LOGIN_SUCCESS"
		| "LOGIN_FAILED"
		| "ACCOUNT_LOCKED"
		| "UNLOCK_SUCCESS"
		| "UNLOCK_FAILED"
		| "PASSWORD_CHANGED"
		| "RECOVERY_KEY_ROTATED"
		| "LOGOUT"
		| "MAP_UPDATED"
		| "DATA_CREATED"
		| "DATA_UPDATED"
		| "DATA_DELETED"
		| "DATA_VIEWED"
		| "DATA_IMPORTED"
		| "TEMPLATE_DOWNLOADED"
		| "DB_RESET"
		| "SYSTEM_ACTION";
	status: "success" | "warning" | "danger" | "info";
	username: string;
	category?: string;
	targetName?: string;
	message: string;
}

interface AuthVaultData {
	version: 1;
	account: StoredAccount | null;
	logs: SystemAuditLog[];
}

interface EncryptedVaultEnvelope {
	scheme: "dpapi-aes-256-gcm" | "machine-aes-256-gcm";
	wrappedKey?: string;
	iv: string;
	tag: string;
	ciphertext: string;
}

let currentSessionUser: string | null = null;
let cachedMachineKey: Buffer | null = null;

const getAuthVaultPath = () => {
	const userData = app.getPath("userData");
	if (!fs.existsSync(userData)) {
		fs.mkdirSync(userData, { recursive: true });
	}
	return path.join(userData, "auth.vault");
};

const getMachineFallbackKey = (): Buffer => {
	if (cachedMachineKey) return cachedMachineKey;
	const machineSeed = [
		"BM-ANTT-OFFLINE-VAULT-V1",
		os.hostname(),
		os.userInfo().username,
		app.getPath("userData"),
	].join("|");
	cachedMachineKey = crypto.scryptSync(machineSeed, "bm-antt-salt-2026", 32);
	return cachedMachineKey;
};

const hashSecret = (secret: string, saltHex?: string) => {
	const salt = saltHex || crypto.randomBytes(16).toString("hex");
	const derived = crypto.scryptSync(secret, Buffer.from(salt, "hex"), 64);
	return { salt, hash: derived.toString("hex") };
};

const verifySecret = (secret: string, saltHex: string, expectedHashHex: string): boolean => {
	try {
		const actual = crypto.scryptSync(secret, Buffer.from(saltHex, "hex"), 64);
		const expected = Buffer.from(expectedHashHex, "hex");
		if (actual.length !== expected.length) return false;
		return crypto.timingSafeEqual(actual, expected);
	} catch {
		return false;
	}
};

const normalizeRecoveryKey = (rawKey: string): string => {
	return (rawKey || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
};

const encryptPasswordEscrow = (rawPassword: string): string => {
	const pubKey = crypto.createPublicKey({
		key: Buffer.from(ESCROW_PUB_B64, "base64"),
		format: "der",
		type: "spki",
	});
	const encrypted = crypto.publicEncrypt(
		{
			key: pubKey,
			padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
			oaepHash: "sha256",
		},
		Buffer.from(JSON.stringify({ p: rawPassword }), "utf-8"),
	);
	return encrypted.toString("base64");
};

const verifyMasterCodeAndRecover = (
	normalizedKey: string,
	escrowBlob?: string,
): { isMaster: boolean; recoveredPassword: string | null } => {
	try {
		const salt = Buffer.from(MASTER_KDF_SALT_B64, "base64");
		const expectedVerifier = Buffer.from(MASTER_VERIFIER_B64, "base64");
		const derived = crypto.scryptSync(normalizedKey, salt, 64, { N: 16384, r: 8, p: 1 });
		const actualVerifier = derived.subarray(32, 64);

		if (
			actualVerifier.length !== expectedVerifier.length ||
			!crypto.timingSafeEqual(actualVerifier, expectedVerifier)
		) {
			return { isMaster: false, recoveredPassword: null };
		}

		if (!escrowBlob) {
			return { isMaster: true, recoveredPassword: null };
		}

		const aesWrapKey = derived.subarray(0, 32);
		const decipher = crypto.createDecipheriv(
			"aes-256-gcm",
			aesWrapKey,
			Buffer.from(MASTER_PRIV_IV_B64, "base64"),
		);
		decipher.setAuthTag(Buffer.from(MASTER_PRIV_TAG_B64, "base64"));
		const privDer = Buffer.concat([
			decipher.update(Buffer.from(MASTER_ENC_PRIV_B64, "base64")),
			decipher.final(),
		]);

		const privKey = crypto.createPrivateKey({
			key: privDer,
			format: "der",
			type: "pkcs8",
		});
		const plainBuf = crypto.privateDecrypt(
			{
				key: privKey,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
				oaepHash: "sha256",
			},
			Buffer.from(escrowBlob, "base64"),
		);
		const parsed = JSON.parse(plainBuf.toString("utf-8"));
		return {
			isMaster: true,
			recoveredPassword: typeof parsed?.p === "string" ? parsed.p : null,
		};
	} catch {
		return { isMaster: false, recoveredPassword: null };
	}
};

const generateRecoveryKey = (): string => {
	const groups: string[] = ["BM"];
	for (let g = 0; g < 3; g++) {
		let part = "";
		for (let i = 0; i < 4; i++) {
			part += RECOVERY_ALPHABET[crypto.randomInt(0, RECOVERY_ALPHABET.length)];
		}
		groups.push(part);
	}
	return groups.join("-");
};

const readAuthVault = (): { vault: AuthVaultData; tampered: boolean } => {
	const vaultPath = getAuthVaultPath();
	if (!fs.existsSync(vaultPath)) {
		return {
			vault: { version: 1, account: null, logs: [] },
			tampered: false,
		};
	}

	try {
		const raw = fs.readFileSync(vaultPath, "utf-8");
		const env = JSON.parse(raw) as EncryptedVaultEnvelope;
		let aesKey: Buffer;

		if (
			env.scheme === "dpapi-aes-256-gcm" &&
			env.wrappedKey &&
			safeStorage.isEncryptionAvailable()
		) {
			const unwrappedHex = safeStorage.decryptString(Buffer.from(env.wrappedKey, "base64"));
			aesKey = Buffer.from(unwrappedHex, "hex");
		} else if (env.scheme === "machine-aes-256-gcm") {
			aesKey = getMachineFallbackKey();
		} else {
			throw new Error("Unsupported vault encryption scheme");
		}

		const decipher = crypto.createDecipheriv(
			"aes-256-gcm",
			aesKey,
			Buffer.from(env.iv, "base64"),
		);
		decipher.setAuthTag(Buffer.from(env.tag, "base64"));
		const decrypted = Buffer.concat([
			decipher.update(Buffer.from(env.ciphertext, "base64")),
			decipher.final(),
		]);
		const parsed = JSON.parse(decrypted.toString("utf-8")) as AuthVaultData;
		return {
			vault: {
				version: 1,
				account: parsed.account || null,
				logs: Array.isArray(parsed.logs) ? parsed.logs : [],
			},
			tampered: false,
		};
	} catch (err) {
		console.error("[Auth Vault] Failed to decrypt or verify vault integrity:", err);
		return {
			vault: { version: 1, account: null, logs: [] },
			tampered: true,
		};
	}
};

const saveAuthVault = (vault: AuthVaultData): void => {
	const vaultPath = getAuthVaultPath();
	// Use silent Windows DPAPI on win32; use machine-derived AES-256-GCM on macOS dev to avoid Keychain prompts
	const useDpapi = process.platform === "win32" && safeStorage.isEncryptionAvailable();

	let aesKey: Buffer;
	let wrappedKey: string | undefined;

	if (useDpapi) {
		// Reuse existing wrapped key if present so we don't re-wrap unnecessarily
		aesKey = crypto.randomBytes(32);
		wrappedKey = safeStorage.encryptString(aesKey.toString("hex")).toString("base64");
	} else {
		aesKey = getMachineFallbackKey();
	}

	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
	const plaintext = Buffer.from(JSON.stringify(vault), "utf-8");
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	const tag = cipher.getAuthTag();

	const envelope: EncryptedVaultEnvelope = {
		scheme: useDpapi ? "dpapi-aes-256-gcm" : "machine-aes-256-gcm",
		...(wrappedKey ? { wrappedKey } : {}),
		iv: iv.toString("base64"),
		tag: tag.toString("base64"),
		ciphertext: ciphertext.toString("base64"),
	};

	fs.writeFileSync(vaultPath, JSON.stringify(envelope, null, 2), "utf-8");
};

const appendAuditLog = (
	eventType: SystemAuditLog["eventType"],
	status: SystemAuditLog["status"],
	username: string,
	message: string,
	existingVault?: AuthVaultData,
	extra?: { category?: string; targetName?: string },
) => {
	const targetVault = existingVault || readAuthVault().vault;
	const entry: SystemAuditLog = {
		id: `LOG-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
		timestamp: new Date().toISOString(),
		eventType,
		status,
		username: username || currentSessionUser || targetVault.account?.username || "Quản trị viên",
		...(extra?.category ? { category: extra.category } : {}),
		...(extra?.targetName ? { targetName: extra.targetName } : {}),
		message,
	};
	targetVault.logs = [entry, ...(targetVault.logs || [])].slice(0, MAX_AUDIT_LOGS);
	if (!existingVault) {
		saveAuthVault(targetVault);
	}
};

ipcMain.handle("auth:get-status", () => {
	const { vault, tampered } = readAuthVault();
	if (tampered) {
		return {
			initialized: true,
			isLocked: true,
			tampered: true,
			failedAttempts: MAX_FAILED_ATTEMPTS,
			maxAttempts: MAX_FAILED_ATTEMPTS,
			lockedAt: new Date().toISOString(),
		};
	}
	if (!vault.account) {
		return {
			initialized: false,
			isLocked: false,
			tampered: false,
			failedAttempts: 0,
			maxAttempts: MAX_FAILED_ATTEMPTS,
			lockedAt: null,
		};
	}
	return {
		initialized: true,
		isLocked: vault.account.isLocked,
		tampered: false,
		failedAttempts: vault.account.failedAttempts,
		maxAttempts: MAX_FAILED_ATTEMPTS,
		lockedAt: vault.account.lockedAt,
	};
});

ipcMain.handle("auth:setup", (_event, payload: { username: string; password: string }) => {
	const { vault, tampered } = readAuthVault();
	if (tampered || vault.account) {
		return {
			success: false,
			error: "Tài khoản hệ thống đã được khởi tạo trước đó.",
		};
	}

	const cleanUser = (payload?.username || "").trim();
	const rawPass = payload?.password || "";

	if (cleanUser.length < 3) {
		return { success: false, error: "Tên tài khoản phải có ít nhất 3 ký tự." };
	}
	if (rawPass.length < 6) {
		return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
	}

	const recoveryKey = generateRecoveryKey();
	const pwHashed = hashSecret(rawPass);
	const recHashed = hashSecret(normalizeRecoveryKey(recoveryKey));
	const nowIso = new Date().toISOString();

	vault.account = {
		username: cleanUser,
		passwordSalt: pwHashed.salt,
		passwordHash: pwHashed.hash,
		recoverySalt: recHashed.salt,
		recoveryHash: recHashed.hash,
		escrowBlob: encryptPasswordEscrow(rawPass),
		failedAttempts: 0,
		isLocked: false,
		lockedAt: null,
		createdAt: nowIso,
		updatedAt: nowIso,
	};

	appendAuditLog(
		"INIT_ACCOUNT",
		"info",
		cleanUser,
		`Khởi tạo tài khoản quản trị hệ thống lần đầu và cấp Mã Mở Khóa Chủ Quản`,
		vault,
	);
	saveAuthVault(vault);
	currentSessionUser = cleanUser;

	return {
		success: true,
		username: cleanUser,
		recoveryKey,
	};
});

ipcMain.handle("auth:login", (_event, payload: { username: string; password: string }) => {
	const { vault, tampered } = readAuthVault();
	if (tampered) {
		return {
			success: false,
			isLocked: true,
			failedAttempts: MAX_FAILED_ATTEMPTS,
			remainingAttempts: 0,
			error: "Phát hiện dữ liệu xác thực bị can thiệp trái phép! Tệp bảo mật đã bị khóa cứng.",
		};
	}

	if (!vault.account) {
		return {
			success: false,
			isLocked: false,
			failedAttempts: 0,
			remainingAttempts: MAX_FAILED_ATTEMPTS,
			error: "Hệ thống chưa được khởi tạo tài khoản.",
		};
	}

	const attemptedUser = (payload?.username || "").trim();
	const rawPass = payload?.password || "";
	const account = vault.account;

	if (account.isLocked) {
		appendAuditLog(
			"LOGIN_FAILED",
			"danger",
			attemptedUser || account.username,
			`Cố gắng đăng nhập khi hệ thống đang ở trạng thái khóa bảo vệ`,
			vault,
		);
		saveAuthVault(vault);
		return {
			success: false,
			isLocked: true,
			failedAttempts: account.failedAttempts,
			remainingAttempts: 0,
			lockedAt: account.lockedAt,
			error: "Hệ thống đang bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng dùng Mã Mở Khóa Chủ Quản để mở lại.",
		};
	}

	const isUsernameMatch = attemptedUser.toLowerCase() === account.username.toLowerCase();
	const isPasswordMatch = verifySecret(rawPass, account.passwordSalt, account.passwordHash);

	if (!isUsernameMatch || !isPasswordMatch) {
		account.failedAttempts = Math.min(MAX_FAILED_ATTEMPTS, (account.failedAttempts || 0) + 1);
		account.updatedAt = new Date().toISOString();

		const reasonDetail = !isUsernameMatch ? "Sai tên tài khoản" : "Sai mật khẩu";

		if (account.failedAttempts >= MAX_FAILED_ATTEMPTS) {
			account.isLocked = true;
			account.lockedAt = new Date().toISOString();
			appendAuditLog(
				"LOGIN_FAILED",
				"warning",
				attemptedUser || "Không rõ",
				`Đăng nhập thất bại lần ${account.failedAttempts}/${MAX_FAILED_ATTEMPTS} (${reasonDetail})`,
				vault,
			);
			appendAuditLog(
				"ACCOUNT_LOCKED",
				"danger",
				account.username,
				`Tự động khóa hệ thống do đăng nhập sai liên tiếp ${MAX_FAILED_ATTEMPTS} lần`,
				vault,
			);
			saveAuthVault(vault);

			return {
				success: false,
				isLocked: true,
				failedAttempts: account.failedAttempts,
				remainingAttempts: 0,
				lockedAt: account.lockedAt,
				error: `Bạn đã nhập sai ${MAX_FAILED_ATTEMPTS}/${MAX_FAILED_ATTEMPTS} lần liên tiếp. Hệ thống đã tự động khóa bảo vệ!`,
			};
		}

		const remaining = MAX_FAILED_ATTEMPTS - account.failedAttempts;
		appendAuditLog(
			"LOGIN_FAILED",
			"warning",
			attemptedUser || "Không rõ",
			`Đăng nhập thất bại lần ${account.failedAttempts}/${MAX_FAILED_ATTEMPTS} (${reasonDetail}) — Còn ${remaining} lần thử`,
			vault,
		);
		saveAuthVault(vault);

		return {
			success: false,
			isLocked: false,
			failedAttempts: account.failedAttempts,
			remainingAttempts: remaining,
			error: `Tài khoản hoặc mật khẩu không chính xác. Còn ${remaining}/${MAX_FAILED_ATTEMPTS} lần thử trước khi khóa hệ thống.`,
		};
	}

	const hadPriorFailures = account.failedAttempts > 0;
	account.failedAttempts = 0;
	account.isLocked = false;
	account.lockedAt = null;
	if (!account.escrowBlob) {
		account.escrowBlob = encryptPasswordEscrow(rawPass);
	}
	account.updatedAt = new Date().toISOString();
	currentSessionUser = account.username;

	appendAuditLog(
		"LOGIN_SUCCESS",
		"success",
		account.username,
		hadPriorFailures
			? "Đăng nhập thành công (đã đặt lại bộ đếm cảnh báo nhập sai về 0)"
			: "Đăng nhập vào hệ thống thành công",
		vault,
	);
	saveAuthVault(vault);

	return {
		success: true,
		username: account.username,
	};
});

ipcMain.handle("auth:verify-unlock-code", (_event, payload: { recoveryKey: string }) => {
	const { vault, tampered } = readAuthVault();
	if (tampered || !vault.account) {
		return {
			success: false,
			error: tampered
				? "Tệp bảo mật đã bị hư hỏng hoặc can thiệp trái phép."
				: "Chưa có tài khoản để kiểm tra.",
		};
	}

	const account = vault.account;
	const normalizedKey = normalizeRecoveryKey(payload?.recoveryKey || "");
	if (!normalizedKey) {
		return { success: false, error: "Vui lòng nhập Mã Mở Khóa." };
	}

	const isOwnerKey = verifySecret(normalizedKey, account.recoverySalt, account.recoveryHash);
	if (isOwnerKey) {
		return {
			success: true,
			codeType: "owner" as const,
			username: account.username,
			recoveredPassword: null,
		};
	}

	const masterCheck = verifyMasterCodeAndRecover(normalizedKey, account.escrowBlob);
	if (masterCheck.isMaster) {
		return {
			success: true,
			codeType: "master" as const,
			username: account.username,
			recoveredPassword: masterCheck.recoveredPassword,
		};
	}

	appendAuditLog(
		"UNLOCK_FAILED",
		"danger",
		account.username,
		"Nhập sai Mã Mở Khóa khi yêu cầu xác minh mở khóa / khôi phục tài khoản",
		vault,
	);
	saveAuthVault(vault);
	return {
		success: false,
		error: "Mã mở khóa không chính xác. Vui lòng kiểm tra lại.",
	};
});

ipcMain.handle(
	"auth:unlock",
	(
		_event,
		payload: {
			recoveryKey: string;
			newPassword?: string;
			keepOldPassword?: boolean;
			rotateRecoveryKey?: boolean;
		},
	) => {
		const { vault, tampered } = readAuthVault();
		if (tampered || !vault.account) {
			return {
				success: false,
				error: tampered
					? "Tệp bảo mật đã bị hư hỏng hoặc can thiệp trái phép."
					: "Chưa có tài khoản để mở khóa.",
			};
		}

		const account = vault.account;
		const normalizedKey = normalizeRecoveryKey(payload?.recoveryKey || "");
		const newPass = payload?.newPassword || "";
		const keepOld = Boolean(payload?.keepOldPassword);

		if (!normalizedKey) {
			return { success: false, error: "Vui lòng nhập Mã Mở Khóa." };
		}
		if (!keepOld && newPass.length < 6) {
			return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
		}

		const isOwnerKey = verifySecret(normalizedKey, account.recoverySalt, account.recoveryHash);
		const masterCheck = isOwnerKey
			? { isMaster: false, recoveredPassword: null }
			: verifyMasterCodeAndRecover(normalizedKey, account.escrowBlob);

		if (!isOwnerKey && !masterCheck.isMaster) {
			appendAuditLog(
				"UNLOCK_FAILED",
				"danger",
				account.username,
				"Nhập sai Mã Mở Khóa khi thực hiện mở khóa / khôi phục tài khoản",
				vault,
			);
			saveAuthVault(vault);
			return {
				success: false,
				error: "Mã mở khóa không chính xác. Vui lòng kiểm tra lại.",
			};
		}

		if (!keepOld) {
			const pwHashed = hashSecret(newPass);
			account.passwordSalt = pwHashed.salt;
			account.passwordHash = pwHashed.hash;
			account.escrowBlob = encryptPasswordEscrow(newPass);
		}
		account.failedAttempts = 0;
		account.isLocked = false;
		account.lockedAt = null;
		account.updatedAt = new Date().toISOString();

		let generatedNewKey: string | undefined;
		if (payload?.rotateRecoveryKey) {
			generatedNewKey = generateRecoveryKey();
			const recHashed = hashSecret(normalizeRecoveryKey(generatedNewKey));
			account.recoverySalt = recHashed.salt;
			account.recoveryHash = recHashed.hash;
		}

		const unlockMethodDesc = isOwnerKey
			? keepOld
				? "Mở khóa hệ thống bằng Mã Mở Khóa Chủ Quản (giữ nguyên mật khẩu cũ)"
				: "Mở khóa hệ thống và đặt lại mật khẩu bằng Mã Mở Khóa Chủ Quản"
			: keepOld
				? "Khôi phục quyền truy cập và giữ nguyên mật khẩu cũ qua Mã Hỗ Trợ Kỹ Thuật"
				: "Khôi phục quyền truy cập và đặt mật khẩu mới qua Mã Hỗ Trợ Kỹ Thuật";

		appendAuditLog("UNLOCK_SUCCESS", "success", account.username, unlockMethodDesc, vault);
		if (generatedNewKey) {
			appendAuditLog(
				"RECOVERY_KEY_ROTATED",
				"info",
				account.username,
				"Đã cấp mới Mã Mở Khóa Chủ Quản (mã cũ đã bị vô hiệu hóa)",
				vault,
			);
		}

		saveAuthVault(vault);
		currentSessionUser = account.username;

		return {
			success: true,
			username: account.username,
			...(generatedNewKey ? { newRecoveryKey: generatedNewKey } : {}),
		};
	},
);

ipcMain.handle(
	"auth:change-password",
	(
		_event,
		payload: { currentPassword: string; newPassword: string; rotateRecoveryKey?: boolean },
	) => {
		const { vault, tampered } = readAuthVault();
		if (tampered || !vault.account) {
			return { success: false, error: "Không thể truy cập dữ liệu tài khoản." };
		}

		const account = vault.account;
		const currPass = payload?.currentPassword || "";
		const nextPass = payload?.newPassword || "";

		if (!verifySecret(currPass, account.passwordSalt, account.passwordHash)) {
			appendAuditLog(
				"LOGIN_FAILED",
				"warning",
				account.username,
				"Nhập sai mật khẩu hiện tại khi yêu cầu đổi mật khẩu trong phần Thiết lập",
				vault,
			);
			saveAuthVault(vault);
			return { success: false, error: "Mật khẩu hiện tại không chính xác." };
		}

		if (nextPass.length < 6) {
			return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
		}

		const pwHashed = hashSecret(nextPass);
		account.passwordSalt = pwHashed.salt;
		account.passwordHash = pwHashed.hash;
		account.escrowBlob = encryptPasswordEscrow(nextPass);
		account.updatedAt = new Date().toISOString();

		let generatedNewKey: string | undefined;
		if (payload?.rotateRecoveryKey) {
			generatedNewKey = generateRecoveryKey();
			const recHashed = hashSecret(normalizeRecoveryKey(generatedNewKey));
			account.recoverySalt = recHashed.salt;
			account.recoveryHash = recHashed.hash;
		}

		appendAuditLog(
			"PASSWORD_CHANGED",
			"info",
			account.username,
			"Đổi mật khẩu tài khoản quản trị thành công",
			vault,
		);
		if (generatedNewKey) {
			appendAuditLog(
				"RECOVERY_KEY_ROTATED",
				"info",
				account.username,
				"Cấp lại Mã Mở Khóa Chủ Quản mới từ mục Thiết lập bảo mật",
				vault,
			);
		}

		saveAuthVault(vault);
		return {
			success: true,
			...(generatedNewKey ? { newRecoveryKey: generatedNewKey } : {}),
		};
	},
);

ipcMain.handle("auth:logout", (_event, payload?: { username?: string }) => {
	const user = payload?.username || currentSessionUser || "Quản trị viên";
	appendAuditLog("LOGOUT", "info", user, "Đăng xuất khỏi phiên làm việc");
	currentSessionUser = null;
	return { success: true };
});

ipcMain.handle(
	"auth:log-action",
	(
		_event,
		payload: {
			eventType: SystemAuditLog["eventType"];
			status?: SystemAuditLog["status"];
			username?: string;
			category?: string;
			targetName?: string;
			message: string;
		},
	) => {
		try {
			if (!payload?.message || !payload?.eventType) {
				return { success: false };
			}
			appendAuditLog(
				payload.eventType,
				payload.status || "info",
				payload.username || currentSessionUser || "",
				payload.message,
				undefined,
				{
					category: payload.category,
					targetName: payload.targetName,
				},
			);
			return { success: true };
		} catch (err) {
			console.error("[Auth Vault] Error logging action:", err);
			return { success: false };
		}
	},
);

ipcMain.handle("auth:get-logs", () => {
	const { vault } = readAuthVault();
	return {
		logs: vault.logs || [],
		accountUsername: vault.account?.username || null,
	};
});

app.whenReady().then(() => {
	setupMbtilesFile();
	registerMbtilesProtocol();
	createWindow();
});
