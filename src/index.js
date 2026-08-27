import fs from "node:fs";
import path from "node:path";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import { HttpClient } from "@actions/http-client";

const REPO = "seaofvoices/darklua";
const TOOL_NAME = "darklua";
const USER_AGENT = "setup-darklua-action";

const http = new HttpClient(USER_AGENT);

async function resolveVersion(requestedVersion) {
  if (!requestedVersion || requestedVersion === "latest") {
    const res = await http.getJson(
      `https://api.github.com/repos/${REPO}/releases/latest`,
    );
    if (!res.result || !res.result.tag_name) {
      throw new Error(
        "Could not determine the latest darklua release from the GitHub API",
      );
    }
    return res.result.tag_name;
  }
  return requestedVersion.startsWith("v")
    ? requestedVersion
    : `v${requestedVersion}`;
}

function resolvePlatform() {
  const platformMap = { linux: "linux", darwin: "macos", win32: "windows" };
  const archMap = { x64: "x86_64", arm64: "aarch64" };

  const platform = platformMap[process.platform];
  const arch = archMap[process.arch];

  if (!platform) {
    throw new Error(`Unsupported operating system: ${process.platform}`);
  }
  if (!arch) {
    throw new Error(
      `Unsupported architecture: ${process.arch} (darklua only publishes x86_64 and aarch64 binaries)`,
    );
  }

  return { platform, arch };
}

async function run() {
  try {
    const requestedVersion = core.getInput("version") || "latest";
    const useCache = core.getInput("cache") !== "false";

    const version = await resolveVersion(requestedVersion);
    core.info(`Using darklua version ${version}`);

    const { platform, arch } = resolvePlatform();
    // tool-cache keys are conventionally bare version numbers (no leading "v")
    const cacheVersion = version.replace(/^v/, "");

    let installDir;

    if (useCache) {
      installDir = tc.find(TOOL_NAME, cacheVersion, arch);
    }

    if (installDir) {
      core.info(`Found cached darklua ${version} at ${installDir}`);
    } else {
      const fileName = `darklua-${platform}-${arch}.zip`;
      const url = `https://github.com/${REPO}/releases/download/${version}/${fileName}`;

      core.info(`Downloading ${url}`);
      let downloadPath;
      try {
        downloadPath = await tc.downloadTool(url);
      } catch (err) {
        throw new Error(
          `Failed to download darklua from ${url}. Check that version '${version}' exists and publishes a '${fileName}' asset. (${err.message})`,
          { cause: err },
        );
      }

      core.info(`Extracting ${fileName}`);
      const extractedDir = await tc.extractZip(downloadPath);

      if (useCache) {
        installDir = await tc.cacheDir(
          extractedDir,
          TOOL_NAME,
          cacheVersion,
          arch,
        );
      } else {
        installDir = extractedDir;
      }
    }

    if (platform !== "windows") {
      fs.chmodSync(path.join(installDir, "darklua"), 0o755);
    }

    core.info(`Adding ${installDir} to PATH`);
    core.addPath(installDir);
    core.setOutput("version", version);
  } catch (err) {
    if (err.cause) {
      core.debug(`Caused by: ${err.cause.stack || err.cause}`);
    }
    core.setFailed(err.message);
  }
}

run();
