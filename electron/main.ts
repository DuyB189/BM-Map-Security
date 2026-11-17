import { app, BrowserWindow, ipcMain, dialog, protocol, safeStorage } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import zlib from "zlib";
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

// --------- Encrypted Embedded SQLite Storage (AES-256-GCM + DPAPI + WAL) & Offline Backup ---------
const GIS_COLLECTION_KEYS = [
	"menu",
	"xaphuong",
	"vuviec",
	"camera",
	"doituong",
	"coquan",
	"cskd",
	"diemnong",
	"tuyenduong",
] as const;

const PORTABLE_BACKUP_MAGIC = "BM-ANTT-ENCRYPTED-BACKUP-V1";
const MAX_LOCAL_SNAPSHOTS = 15;

let gisSqliteDb: SQLiteDatabaseSync | null = null;
let cachedDataDek: Buffer | null = null;
let cachedEncryptionScheme: "dpapi-aes-256-gcm" | "machine-aes-256-gcm" = "machine-aes-256-gcm";
const inMemoryCollectionHashes = new Map<string, string>();

const ensureUserDataDir = (): string => {
	const userData = app.getPath("userData");
	if (!fs.existsSync(userData)) {
		fs.mkdirSync(userData, { recursive: true });
	}
	return userData;
};

const getEncryptedDbPath = () => path.join(ensureUserDataDir(), "gis_security.db");
const getLegacyPlainJsonPath = () => path.join(ensureUserDataDir(), "data.json");
const getBackupsDir = () => {
	const dir = path.join(ensureUserDataDir(), "backups");
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	return dir;
};

const getLocalDayStamp = (d = new Date()): string => {
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};

const getLocalFileTimestamp = (d = new Date()): string => {
	const hh = String(d.getHours()).padStart(2, "0");
	const mi = String(d.getMinutes()).padStart(2, "0");
	const ss = String(d.getSeconds()).padStart(2, "0");
	return `${getLocalDayStamp(d)}_${hh}${mi}${ss}`;
};

const computeDataSummary = (gisData: any) => {
	const counts = {
		vuviec: Array.isArray(gisData?.vuviec) ? gisData.vuviec.length : 0,
		camera: Array.isArray(gisData?.camera) ? gisData.camera.length : 0,
		doituong: Array.isArray(gisData?.doituong) ? gisData.doituong.length : 0,
		coquan: Array.isArray(gisData?.coquan) ? gisData.coquan.length : 0,
		cskd: Array.isArray(gisData?.cskd) ? gisData.cskd.length : 0,
		diemnong: Array.isArray(gisData?.diemnong) ? gisData.diemnong.length : 0,
		tuyenduong: Array.isArray(gisData?.tuyenduong) ? gisData.tuyenduong.length : 0,
	};
	const totalRecords = Object.values(counts).reduce((s, n) => s + n, 0);
	return { totalRecords, counts };
};

const securelyShredFile = (targetFile: string) => {
	try {
		if (!fs.existsSync(targetFile)) return;
		const stat = fs.statSync(targetFile);
		if (stat.size > 0) {
			const fd = fs.openSync(targetFile, "r+");
			const randomNoise = crypto.randomBytes(stat.size);
			fs.writeSync(fd, randomNoise, 0, randomNoise.length, 0);
			fs.fsyncSync(fd);
			fs.closeSync(fd);
		}
		fs.unlinkSync(targetFile);
	} catch (err) {
		console.warn("[Encrypted GIS DB] Could not shred legacy file:", err);
	}
};

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

// --------- Encrypted SQLite Implementation, Auto-Snapshots & Portable Migration (.bmbackup) ---------
const getOrCreateDataDek = (db: SQLiteDatabaseSync): Buffer => {
	if (cachedDataDek) return cachedDataDek;

	const row = db
		.prepare("SELECT value FROM vault_meta WHERE key = 'dek_envelope'")
		.get() as { value: string } | undefined;

	const canUseWinDpapi = process.platform === "win32" && safeStorage.isEncryptionAvailable();

	if (row && row.value) {
		const env = JSON.parse(row.value);
		if (
			env.scheme === "dpapi-aes-256-gcm" &&
			env.wrappedDek &&
			safeStorage.isEncryptionAvailable()
		) {
			const hex = safeStorage.decryptString(Buffer.from(env.wrappedDek, "base64"));
			cachedDataDek = Buffer.from(hex, "hex");
			cachedEncryptionScheme = "dpapi-aes-256-gcm";
			return cachedDataDek;
		}
		if (env.scheme === "machine-aes-256-gcm" && env.wrappedDek && env.iv && env.tag) {
			const wrapKey = getMachineFallbackKey();
			const decipher = crypto.createDecipheriv(
				"aes-256-gcm",
				wrapKey,
				Buffer.from(env.iv, "base64"),
			);
			decipher.setAuthTag(Buffer.from(env.tag, "base64"));
			cachedDataDek = Buffer.concat([
				decipher.update(Buffer.from(env.wrappedDek, "base64")),
				decipher.final(),
			]);
			cachedEncryptionScheme = "machine-aes-256-gcm";
			return cachedDataDek;
		}
		throw new Error("Không thể giải mã khóa bảo vệ CSDL (DEK) trên thiết bị này.");
	}

	// Khởi tạo khóa dữ liệu gốc 256-bit (DEK) lần đầu tiên
	const newDek = crypto.randomBytes(32);
	let metaEnvelope: any;

	if (canUseWinDpapi) {
		const wrapped = safeStorage.encryptString(newDek.toString("hex")).toString("base64");
		metaEnvelope = {
			scheme: "dpapi-aes-256-gcm",
			wrappedDek: wrapped,
			createdAt: new Date().toISOString(),
		};
		cachedEncryptionScheme = "dpapi-aes-256-gcm";
	} else {
		const wrapKey = getMachineFallbackKey();
		const iv = crypto.randomBytes(12);
		const cipher = crypto.createCipheriv("aes-256-gcm", wrapKey, iv);
		const enc = Buffer.concat([cipher.update(newDek), cipher.final()]);
		const tag = cipher.getAuthTag();
		metaEnvelope = {
			scheme: "machine-aes-256-gcm",
			iv: iv.toString("base64"),
			tag: tag.toString("base64"),
			wrappedDek: enc.toString("base64"),
			createdAt: new Date().toISOString(),
		};
		cachedEncryptionScheme = "machine-aes-256-gcm";
	}

	db.prepare("INSERT OR REPLACE INTO vault_meta (key, value) VALUES ('dek_envelope', ?)").run(
		JSON.stringify(metaEnvelope),
	);
	cachedDataDek = newDek;
	return newDek;
};

const ensureGisDbOpen = (): SQLiteDatabaseSync => {
	if (gisSqliteDb) return gisSqliteDb;

	const dbPath = getEncryptedDbPath();
	const db = new DatabaseSync(dbPath);
	db.exec(`
		PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		CREATE TABLE IF NOT EXISTS vault_meta (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS encrypted_collections (
			collection_name TEXT PRIMARY KEY,
			record_count INTEGER NOT NULL,
			content_sha256 TEXT NOT NULL,
			iv BLOB NOT NULL,
			auth_tag BLOB NOT NULL,
			ciphertext BLOB NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);

	gisSqliteDb = db;
	getOrCreateDataDek(db);

	// Tự động di trú (migrate) dữ liệu từ file data.json thuần văn bản cũ (nếu còn tồn tại) sang SQLite mã hóa
	const countRow = db
		.prepare("SELECT COUNT(*) as cnt FROM encrypted_collections")
		.get() as { cnt: number };
	const legacyJsonPath = getLegacyPlainJsonPath();

	if (countRow.cnt === 0 && fs.existsSync(legacyJsonPath)) {
		try {
			const rawLegacy = fs.readFileSync(legacyJsonPath, "utf-8");
			const parsedLegacy = JSON.parse(rawLegacy);
			if (parsedLegacy && typeof parsedLegacy === "object") {
				writeEncryptedCollections(parsedLegacy, false);
				createLocalEncryptedSnapshot(parsedLegacy, "auto_daily");
				securelyShredFile(legacyJsonPath);
				console.log(
					"[Encrypted GIS DB] Migrated legacy data.json into encrypted SQLite vault and shredded plaintext file.",
				);
			}
		} catch (migErr) {
			console.error("[Encrypted GIS DB] Failed migrating legacy data.json:", migErr);
		}
	}

	return db;
};

const readEncryptedCollections = (): any | null => {
	const db = ensureGisDbOpen();
	const dek = getOrCreateDataDek(db);

	const rows = db
		.prepare(
			"SELECT collection_name, content_sha256, iv, auth_tag, ciphertext FROM encrypted_collections",
		)
		.all() as {
		collection_name: string;
		content_sha256: string;
		iv: Uint8Array;
		auth_tag: Uint8Array;
		ciphertext: Uint8Array;
	}[];

	if (!rows || rows.length === 0) {
		return null;
	}

	const result: Record<string, any> = {};
	for (const row of rows) {
		const decipher = crypto.createDecipheriv(
			"aes-256-gcm",
			dek,
			Buffer.from(row.iv),
		);
		decipher.setAuthTag(Buffer.from(row.auth_tag));
		const compressed = Buffer.concat([
			decipher.update(Buffer.from(row.ciphertext)),
			decipher.final(),
		]);
		const jsonBuf = zlib.inflateSync(compressed);
		result[row.collection_name] = JSON.parse(jsonBuf.toString("utf-8"));
		inMemoryCollectionHashes.set(row.collection_name, row.content_sha256);
	}

	for (const key of GIS_COLLECTION_KEYS) {
		if (!(key in result)) {
			result[key] = [];
		}
	}

	return result;
};

const createLocalEncryptedSnapshot = (
	gisData: any,
	reason: "auto_daily" | "manual" | "pre_restore",
): { fileName: string; sizeBytes: number } | null => {
	try {
		const db = ensureGisDbOpen();
		const dek = getOrCreateDataDek(db);
		const summary = computeDataSummary(gisData);
		const backupsDir = getBackupsDir();

		const iv = crypto.randomBytes(12);
		const cipher = crypto.createCipheriv("aes-256-gcm", dek, iv);
		const compressedPayload = zlib.gzipSync(Buffer.from(JSON.stringify(gisData), "utf-8"));
		const ciphertext = Buffer.concat([cipher.update(compressedPayload), cipher.final()]);
		const tag = cipher.getAuthTag();

		const stamp = getLocalFileTimestamp();
		const fileName = `snapshot_${stamp}_${reason}.bmsnap`;
		const fullPath = path.join(backupsDir, fileName);
		const tmpPath = `${fullPath}.tmp`;

		const envelope = {
			version: 1,
			id: fileName,
			createdAt: new Date().toISOString(),
			reason,
			summary,
			iv: iv.toString("base64"),
			tag: tag.toString("base64"),
			ciphertext: ciphertext.toString("base64"),
		};

		fs.writeFileSync(tmpPath, JSON.stringify(envelope), "utf-8");
		fs.renameSync(tmpPath, fullPath);

		// Giữ tối đa MAX_LOCAL_SNAPSHOTS bản sao lưu nội bộ gần nhất
		const allSnaps = fs
			.readdirSync(backupsDir)
			.filter((f) => f.endsWith(".bmsnap"))
			.map((f) => ({
				name: f,
				full: path.join(backupsDir, f),
				mtime: fs.statSync(path.join(backupsDir, f)).mtimeMs,
			}))
			.sort((a, b) => b.mtime - a.mtime);

		for (let i = MAX_LOCAL_SNAPSHOTS; i < allSnaps.length; i++) {
			try {
				fs.unlinkSync(allSnaps[i].full);
			} catch {
				// Ignore cleanup error
			}
		}

		const stat = fs.statSync(fullPath);
		return { fileName, sizeBytes: stat.size };
	} catch (err) {
		console.error("[Encrypted GIS DB] Failed creating local snapshot:", err);
		return null;
	}
};

const writeEncryptedCollections = (newData: any, allowAutoDailyBackup = true): void => {
	const db = ensureGisDbOpen();
	const dek = getOrCreateDataDek(db);
	const nowIso = new Date().toISOString();

	const upsertStmt = db.prepare(`
		INSERT OR REPLACE INTO encrypted_collections
		(collection_name, record_count, content_sha256, iv, auth_tag, ciphertext, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`);

	let anyChanged = false;
	db.exec("BEGIN IMMEDIATE");
	try {
		for (const key of GIS_COLLECTION_KEYS) {
			const arr = Array.isArray(newData?.[key]) ? newData[key] : [];
			const rawStr = JSON.stringify(arr);
			const sha = crypto.createHash("sha256").update(rawStr).digest("hex");

			if (inMemoryCollectionHashes.get(key) === sha) {
				continue;
			}

			const compressed = zlib.deflateSync(Buffer.from(rawStr, "utf-8"), { level: 6 });
			const iv = crypto.randomBytes(12);
			const cipher = crypto.createCipheriv("aes-256-gcm", dek, iv);
			const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
			const authTag = cipher.getAuthTag();

			upsertStmt.run(key, arr.length, sha, iv, authTag, ciphertext, nowIso);
			inMemoryCollectionHashes.set(key, sha);
			anyChanged = true;
		}
		db.exec("COMMIT");
	} catch (txErr) {
		db.exec("ROLLBACK");
		throw txErr;
	}

	// Tự động chụp 1 bản sao lưu nội bộ mỗi ngày khi có phát sinh thay đổi dữ liệu
	if (allowAutoDailyBackup && anyChanged) {
		const todayStr = getLocalDayStamp();
		const lastRow = db
			.prepare("SELECT value FROM vault_meta WHERE key = 'last_auto_backup_date'")
			.get() as { value: string } | undefined;

		if (!lastRow || lastRow.value !== todayStr) {
			const summary = computeDataSummary(newData);
			if (summary.totalRecords > 0) {
				createLocalEncryptedSnapshot(newData, "auto_daily");
				db.prepare(
					"INSERT OR REPLACE INTO vault_meta (key, value) VALUES ('last_auto_backup_date', ?)",
				).run(todayStr);
			}
		}
	}
};

// Hợp nhất dữ liệu không trùng lặp khi người dùng chọn chế độ "Gộp dữ liệu (Merge)"
const mergeGisDatasets = (currentData: any, incomingData: any): any => {
	const merged: Record<string, any> = {
		menu: currentData?.menu || incomingData?.menu || [],
		xaphuong: currentData?.xaphuong || incomingData?.xaphuong || [],
	};

	const mergeByKey = (curArr: any[], incArr: any[], keyFn: (it: any) => string) => {
		const out = [...(Array.isArray(curArr) ? curArr : [])];
		const seen = new Set(out.map(keyFn));
		for (const item of Array.isArray(incArr) ? incArr : []) {
			const k = keyFn(item);
			if (!seen.has(k)) {
				seen.add(k);
				out.push(item);
			}
		}
		return out;
	};

	merged.vuviec = mergeByKey(
		currentData?.vuviec,
		incomingData?.vuviec,
		(x) => `${x.id || ""}|${x.loai || ""}|${x.lng}|${x.lat}`,
	);
	merged.camera = mergeByKey(
		currentData?.camera,
		incomingData?.camera,
		(x) => `${x.id || ""}|${x.ten || ""}|${x.lng}|${x.lat}`,
	);
	merged.doituong = mergeByKey(
		currentData?.doituong,
		incomingData?.doituong,
		(x) => `${x.cccd || x.id || ""}|${x.hoten || ""}`,
	);
	merged.coquan = mergeByKey(
		currentData?.coquan,
		incomingData?.coquan,
		(x) => `${x.ten || ""}|${x.lng}|${x.lat}`,
	);
	merged.cskd = mergeByKey(
		currentData?.cskd,
		incomingData?.cskd,
		(x) => `${x.mst || x.ten || ""}|${x.lng}|${x.lat}`,
	);
	merged.diemnong = mergeByKey(
		currentData?.diemnong,
		incomingData?.diemnong,
		(x) => `${x.ten || ""}|${x.lng}|${x.lat}`,
	);
	merged.tuyenduong = mergeByKey(
		currentData?.tuyenduong,
		incomingData?.tuyenduong,
		(x) => `${x.ten || ""}|${x.type || ""}`,
	);

	return merged;
};

ipcMain.handle("db:get-data", () => {
	try {
		return readEncryptedCollections();
	} catch (error) {
		console.error("[Encrypted GIS DB] Error reading encrypted database:", error);
		return null;
	}
});

ipcMain.handle("db:save-data", (_event, newData) => {
	try {
		writeEncryptedCollections(newData, true);
		return true;
	} catch (error) {
		console.error("[Encrypted GIS DB] Error writing encrypted database:", error);
		throw error;
	}
});

ipcMain.handle("backup:get-info", () => {
	try {
		ensureGisDbOpen();
		const dbPath = getEncryptedDbPath();
		const dbSizeBytes = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
		const currentData = readEncryptedCollections();
		const summary = computeDataSummary(currentData);

		const backupsDir = getBackupsDir();
		const snapshots = fs
			.readdirSync(backupsDir)
			.filter((f) => f.endsWith(".bmsnap"))
			.map((f) => {
				const full = path.join(backupsDir, f);
				const stat = fs.statSync(full);
				try {
					const raw = JSON.parse(fs.readFileSync(full, "utf-8"));
					return {
						id: f,
						createdAt: raw.createdAt || stat.mtime.toISOString(),
						reason: raw.reason || "manual",
						totalRecords: raw.summary?.totalRecords ?? 0,
						sizeBytes: stat.size,
					};
				} catch {
					return null;
				}
			})
			.filter(Boolean)
			.sort(
				(a: any, b: any) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);

		return {
			success: true,
			engine: "SQLite WAL + Zlib + AES-256-GCM",
			encryptionScheme: cachedEncryptionScheme,
			dbPath,
			dbSizeBytes,
			summary,
			snapshots,
		};
	} catch (err: any) {
		return { success: false, error: err.message || "Không thể đọc thông tin lưu trữ." };
	}
});

ipcMain.handle("backup:create-local-snapshot", () => {
	try {
		const currentData = readEncryptedCollections();
		if (!currentData) {
			return { success: false, error: "Chưa có dữ liệu để tạo bản sao lưu nội bộ." };
		}
		const snap = createLocalEncryptedSnapshot(currentData, "manual");
		if (!snap) {
			return { success: false, error: "Không thể ghi tệp sao lưu nội bộ." };
		}
		appendAuditLog(
			"SYSTEM_ACTION",
			"success",
			currentSessionUser || "Quản trị viên",
			`Tạo bản sao lưu nội bộ mã hóa trên máy (${snap.fileName})`,
		);
		return { success: true, fileName: snap.fileName, sizeBytes: snap.sizeBytes };
	} catch (err: any) {
		return { success: false, error: err.message || "Lỗi khi tạo bản sao lưu nội bộ." };
	}
});

ipcMain.handle("backup:restore-local-snapshot", (_event, payload: { snapshotId: string }) => {
	try {
		const db = ensureGisDbOpen();
		const dek = getOrCreateDataDek(db);
		const safeName = path.basename(payload?.snapshotId || "");
		const fullPath = path.join(getBackupsDir(), safeName);

		if (!safeName || !fs.existsSync(fullPath)) {
			return { success: false, error: "Không tìm thấy tệp sao lưu nội bộ đã chọn." };
		}

		const env = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
		const decipher = crypto.createDecipheriv(
			"aes-256-gcm",
			dek,
			Buffer.from(env.iv, "base64"),
		);
		decipher.setAuthTag(Buffer.from(env.tag, "base64"));
		const gzBuf = Buffer.concat([
			decipher.update(Buffer.from(env.ciphertext, "base64")),
			decipher.final(),
		]);
		const restoredData = JSON.parse(zlib.gunzipSync(gzBuf).toString("utf-8"));

		// Lưu mốc an toàn trước khi khôi phục
		const currentData = readEncryptedCollections();
		if (currentData && computeDataSummary(currentData).totalRecords > 0) {
			createLocalEncryptedSnapshot(currentData, "pre_restore");
		}

		inMemoryCollectionHashes.clear();
		writeEncryptedCollections(restoredData, false);

		const sum = computeDataSummary(restoredData);
		appendAuditLog(
			"SYSTEM_ACTION",
			"warning",
			currentSessionUser || "Quản trị viên",
			`Khôi phục dữ liệu từ bản sao lưu nội bộ "${safeName}" (${sum.totalRecords} bản ghi)`,
		);

		return { success: true, data: restoredData, totalRecords: sum.totalRecords };
	} catch (err: any) {
		return {
			success: false,
			error: "Không thể giải mã hoặc khôi phục bản sao lưu nội bộ: " + (err.message || ""),
		};
	}
});

ipcMain.handle(
	"backup:export-portable",
	async (_event, payload: { passphrase: string; includeAuditLogs?: boolean }) => {
		try {
			const passphrase = (payload?.passphrase || "").trim();
			if (passphrase.length < 6) {
				return {
					success: false,
					error: "Mật khẩu bảo vệ gói sao lưu phải có ít nhất 6 ký tự.",
				};
			}

			const currentData = readEncryptedCollections();
			if (!currentData) {
				return {
					success: false,
					error: "Hệ thống hiện chưa có dữ liệu nào để kết xuất.",
				};
			}

			const defaultName = `SaoLuu_ANTT_BinhMinh_${getLocalDayStamp()}.bmbackup`;
			const saveDialog = await dialog.showSaveDialog(win || undefined, {
				title: "Kết xuất Gói Sao lưu Mã hóa (.bmbackup) để chuyển máy / lưu USB",
				defaultPath: defaultName,
				filters: [{ name: "Gói Sao lưu Bảo mật ANTT (.bmbackup)", extensions: ["bmbackup"] }],
			});

			if (saveDialog.canceled || !saveDialog.filePath) {
				return { success: false, reason: "cancelled" };
			}

			const includeLogs = Boolean(payload?.includeAuditLogs);
			const { vault } = readAuthVault();
			const summary = computeDataSummary(currentData);

			const innerBundle = {
				exportedAt: new Date().toISOString(),
				gisData: currentData,
				...(includeLogs ? { auditLogs: vault.logs || [] } : {}),
			};

			const salt = crypto.randomBytes(32);
			const derivedKey = crypto.scryptSync(passphrase.normalize("NFKC"), salt, 32, {
				N: 32768,
				r: 8,
				p: 1,
				maxmem: 64 * 1024 * 1024,
			});

			const iv = crypto.randomBytes(12);
			const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv);
			const compressedInner = zlib.gzipSync(
				Buffer.from(JSON.stringify(innerBundle), "utf-8"),
				{ level: 9 },
			);
			const ciphertext = Buffer.concat([cipher.update(compressedInner), cipher.final()]);
			const tag = cipher.getAuthTag();

			const portablePackage = {
				magic: PORTABLE_BACKUP_MAGIC,
				version: 1,
				createdAt: new Date().toISOString(),
				sourceHost: os.hostname(),
				summary: {
					...summary,
					includesAuditLogs: includeLogs,
				},
				kdf: {
					algorithm: "scrypt",
					salt: salt.toString("base64"),
					N: 32768,
					r: 8,
					p: 1,
				},
				cipher: {
					algorithm: "aes-256-gcm",
					iv: iv.toString("base64"),
					tag: tag.toString("base64"),
					ciphertext: ciphertext.toString("base64"),
				},
			};

			const targetPath = saveDialog.filePath;
			const tmpPath = `${targetPath}.tmp`;
			fs.writeFileSync(tmpPath, JSON.stringify(portablePackage), "utf-8");
			fs.renameSync(tmpPath, targetPath);

			const stat = fs.statSync(targetPath);
			appendAuditLog(
				"SYSTEM_ACTION",
				"success",
				currentSessionUser || "Quản trị viên",
				`Kết xuất Gói Sao lưu Mã hóa di động "${path.basename(targetPath)}" (${summary.totalRecords} bản ghi)`,
			);

			return {
				success: true,
				filePath: targetPath,
				fileName: path.basename(targetPath),
				sizeBytes: stat.size,
				totalRecords: summary.totalRecords,
			};
		} catch (err: any) {
			console.error("[Portable Backup] Export error:", err);
			return { success: false, error: err.message || "Lỗi khi đóng gói tệp sao lưu." };
		}
	},
);

ipcMain.handle("backup:inspect-portable", async () => {
	try {
		const openRes = await dialog.showOpenDialog(win || undefined, {
			title: "Chọn Gói Sao lưu Bảo mật (.bmbackup) cần nhập vào máy này",
			filters: [{ name: "Gói Sao lưu Bảo mật ANTT (.bmbackup)", extensions: ["bmbackup"] }],
			properties: ["openFile"],
		});

		if (openRes.canceled || openRes.filePaths.length === 0) {
			return { success: false, reason: "cancelled" };
		}

		const filePath = openRes.filePaths[0];
		const stat = fs.statSync(filePath);
		const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

		if (raw?.magic !== PORTABLE_BACKUP_MAGIC || !raw?.cipher?.ciphertext || !raw?.kdf?.salt) {
			return {
				success: false,
				error: "Tệp được chọn không phải là Gói Sao lưu Bảo mật (.bmbackup) hợp lệ của hệ thống.",
			};
		}

		return {
			success: true,
			filePath,
			fileName: path.basename(filePath),
			sizeBytes: stat.size,
			createdAt: raw.createdAt,
			sourceHost: raw.sourceHost || "Máy trạm nội bộ",
			summary: raw.summary || { totalRecords: 0, counts: {}, includesAuditLogs: false },
		};
	} catch (err: any) {
		return {
			success: false,
			error: "Không thể đọc thông tin tệp sao lưu. Tệp có thể bị lỗi định dạng.",
		};
	}
});

ipcMain.handle(
	"backup:import-portable",
	(
		_event,
		payload: {
			filePath: string;
			passphrase: string;
			mode: "replace" | "merge";
			restoreAuditLogs?: boolean;
		},
	) => {
		try {
			const filePath = payload?.filePath || "";
			const passphrase = (payload?.passphrase || "").trim();
			const mode = payload?.mode === "merge" ? "merge" : "replace";

			if (!filePath || !fs.existsSync(filePath)) {
				return { success: false, error: "Không tìm thấy đường dẫn tệp sao lưu." };
			}
			if (!passphrase) {
				return { success: false, error: "Vui lòng nhập mật khẩu giải mã gói sao lưu." };
			}

			const pkg = JSON.parse(fs.readFileSync(filePath, "utf-8"));
			if (pkg?.magic !== PORTABLE_BACKUP_MAGIC) {
				return { success: false, error: "Định dạng tệp sao lưu không hợp lệ." };
			}

			let decryptedInner: any;
			try {
				const salt = Buffer.from(pkg.kdf.salt, "base64");
				const N = Number(pkg.kdf.N) || 32768;
				const r = Number(pkg.kdf.r) || 8;
				const p = Number(pkg.kdf.p) || 1;
				const derivedKey = crypto.scryptSync(passphrase.normalize("NFKC"), salt, 32, {
					N,
					r,
					p,
					maxmem: 128 * 1024 * 1024,
				});

				const decipher = crypto.createDecipheriv(
					"aes-256-gcm",
					derivedKey,
					Buffer.from(pkg.cipher.iv, "base64"),
				);
				decipher.setAuthTag(Buffer.from(pkg.cipher.tag, "base64"));
				const gzBuf = Buffer.concat([
					decipher.update(Buffer.from(pkg.cipher.ciphertext, "base64")),
					decipher.final(),
				]);
				decryptedInner = JSON.parse(zlib.gunzipSync(gzBuf).toString("utf-8"));
			} catch {
				appendAuditLog(
					"SYSTEM_ACTION",
					"danger",
					currentSessionUser || "Quản trị viên",
					`Giải mã thất bại Gói Sao lưu "${path.basename(filePath)}" (sai mật khẩu bảo vệ hoặc tệp bị sửa đổi)`,
				);
				return {
					success: false,
					error: "Mật khẩu giải mã không chính xác hoặc tệp sao lưu đã bị can thiệp trái phép!",
				};
			}

			if (!decryptedInner?.gisData) {
				return { success: false, error: "Gói sao lưu không chứa dữ liệu bản đồ hợp lệ." };
			}

			// Luôn tự động chụp 1 bản sao lưu an toàn của máy hiện tại trước khi ghi đè / gộp
			const existingData = readEncryptedCollections();
			if (existingData && computeDataSummary(existingData).totalRecords > 0) {
				createLocalEncryptedSnapshot(existingData, "pre_restore");
			}

			const finalData =
				mode === "merge" && existingData
					? mergeGisDatasets(existingData, decryptedInner.gisData)
					: decryptedInner.gisData;

			inMemoryCollectionHashes.clear();
			writeEncryptedCollections(finalData, false);

			// Khôi phục / hợp nhất nhật ký lịch sử hệ thống nếu được chọn
			if (payload?.restoreAuditLogs && Array.isArray(decryptedInner.auditLogs)) {
				const { vault } = readAuthVault();
				const existingIds = new Set((vault.logs || []).map((l) => l.id));
				const mergedLogs = [...(vault.logs || [])];
				for (const log of decryptedInner.auditLogs) {
					if (log?.id && !existingIds.has(log.id)) {
						existingIds.add(log.id);
						mergedLogs.push(log);
					}
				}
				mergedLogs.sort(
					(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
				);
				vault.logs = mergedLogs.slice(0, MAX_AUDIT_LOGS);
				saveAuthVault(vault);
			}

			const finalSummary = computeDataSummary(finalData);
			appendAuditLog(
				"SYSTEM_ACTION",
				"success",
				currentSessionUser || "Quản trị viên",
				mode === "replace"
					? `Khôi phục nguyên trạng dữ liệu từ tệp "${path.basename(filePath)}" (${finalSummary.totalRecords} bản ghi)`
					: `Gộp bổ sung dữ liệu từ tệp "${path.basename(filePath)}" (Tổng sau gộp: ${finalSummary.totalRecords} bản ghi)`,
			);

			return {
				success: true,
				data: finalData,
				totalRecords: finalSummary.totalRecords,
			};
		} catch (err: any) {
			console.error("[Portable Backup] Import error:", err);
			return { success: false, error: err.message || "Lỗi khi nhập gói sao lưu." };
		}
	},
);

app.on("before-quit", () => {
	try {
		if (gisSqliteDb) {
			gisSqliteDb.close();
			gisSqliteDb = null;
		}
		if (mbtilesDb) {
			mbtilesDb.close();
			mbtilesDb = null;
		}
	} catch {
		// Ignore shutdown close error
	}
});

app.whenReady().then(() => {
	ensureGisDbOpen();
	setupMbtilesFile();
	registerMbtilesProtocol();
	createWindow();
});
