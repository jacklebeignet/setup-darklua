# setup-darklua

A GitHub Action that downloads and installs [darklua](https://github.com/seaofvoices/darklua) so it's available on `PATH` in later workflow steps.

## Usage

```yaml
- uses: jacklebeignet/setup-darklua@v1
  with:
    version: latest

- run: darklua --version
```

## Inputs

| Name      | Description                          | Required | Default  |
|-----------|---------------------------------------|----------|----------|
| `version` | Which darklua version to install. Accepts a tag like `v0.19.0` or a bare version like `0.19.0`. | No | `latest` |

## Outputs

| Name      | Description                                  |
|-----------|-----------------------------------------------|
| `version` | The exact darklua version that was installed. |

## How it works

1. Resolves `version`. If set to `latest`, it queries the GitHub API for the latest darklua release tag.
2. Detects the runner's OS and architecture and maps them to darklua's release asset naming (`linux`, `macos`, `windows` / `x86_64`, `aarch64`).
3. Checks the runner's tool cache for a matching install before downloading anything.
4. On a cache miss, downloads the matching zip from the darklua GitHub releases page and extracts it.
5. Adds the installed binary's directory to `PATH`.

Supported combinations are whatever darklua publishes release assets for. As of this writing that's Linux, macOS, and Windows on x86_64, plus Linux and macOS on aarch64.

## Development

Install dependencies:

```
npm install
```

Build:

```
npm run build
```

## License

[MIT](LICENSE)
