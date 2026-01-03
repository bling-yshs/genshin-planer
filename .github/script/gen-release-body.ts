/**
 * 生成 Release Body (包含下载表格)
 *
 * 使用方式:
 *
 * 正式版本:
 * npx tsx gen-release-body.ts \
 *   --version <版本号> \
 *   --tag <版本标签> \
 *   --changelog <更新日志> \
 *   --changelog-link <Full Changelog 链接> \
 *   --platform <github|cnb>
 *
 * Alpha 版本:
 * npx tsx gen-release-body.ts \
 *   --alpha \
 *   --commit <commit sha>
 *
 * 输出: Release Body 内容 (直接输出到 stdout)
 */

import process from 'node:process'

interface ReleaseArgs {
  mode: 'release'
  version: string
  tag: string
  changelog: string
  changelogLink: string
  platform: 'github' | 'cnb'
}

interface AlphaArgs {
  mode: 'alpha'
  commit: string
}

type Args = ReleaseArgs | AlphaArgs

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Record<string, string> = {}

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    if (arg === '--alpha') {
      result.alpha = 'true'
      i++
    }
    else if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '').replace(/-/g, '_')
      result[key] = args[i + 1]
      i += 2
    }
    else {
      i++
    }
  }

  // Alpha 模式
  if (result.alpha === 'true') {
    if (!result.commit)
      throw new Error('缺少必须参数: --commit')

    return {
      mode: 'alpha',
      commit: result.commit,
    }
  }

  // 正式版本模式
  if (!result.version)
    throw new Error('缺少必须参数: --version')
  if (!result.tag)
    throw new Error('缺少必须参数: --tag')
  if (!result.changelog)
    throw new Error('缺少必须参数: --changelog')
  if (!result.changelog_link)
    throw new Error('缺少必须参数: --changelog-link')
  if (!result.platform)
    throw new Error('缺少必须参数: --platform')

  return {
    mode: 'release',
    version: result.version,
    tag: result.tag,
    changelog: result.changelog,
    changelogLink: result.changelog_link,
    platform: result.platform as 'github' | 'cnb',
  }
}

function generateDownloadTable(tag: string, platform: 'github' | 'cnb'): string {
  const githubBase = `https://github.com/bling-yshs/genshin-planer/releases/download/${tag}`
  const cnbBase = `https://cnb.cool/bling-team/genshin-planer/-/releases/download/${tag}`

  const baseUrl = platform === 'github' ? githubBase : cnbBase

  const downloads = [
    { os: 'Windows x64', file: `genshin-planner_${tag.replace('v', '')}_x64-setup.exe`, emoji: '🪟' },
    { os: 'Windows ARM64', file: `genshin-planner_${tag.replace('v', '')}_arm64-setup.exe`, emoji: '🪟' },
    { os: 'macOS (Apple Silicon)', file: `genshin-planner_${tag.replace('v', '')}_aarch64.dmg`, emoji: '🍎' },
    { os: 'macOS (Intel)', file: `genshin-planner_${tag.replace('v', '')}_x64.dmg`, emoji: '🍎' },
    { os: 'Linux x64 (deb)', file: `genshin-planner_${tag.replace('v', '')}_amd64.deb`, emoji: '🐧' },
    { os: 'Linux x64 (rpm)', file: `genshin-planner-${tag.replace('v', '')}-1.x86_64.rpm`, emoji: '🐧' },
    { os: 'Linux ARM64 (deb)', file: `genshin-planner_${tag.replace('v', '')}_arm64.deb`, emoji: '🐧' },
    { os: 'Linux ARM64 (rpm)', file: `genshin-planner-${tag.replace('v', '')}-1.aarch64.rpm`, emoji: '🐧' },
  ]

  let table = '## 📥 下载\n\n'
  table += '| 平台 | 下载链接 |\n'
  table += '| :--- | :--- |\n'

  for (const d of downloads) {
    table += `| ${d.emoji} ${d.os} | [${d.file}](${baseUrl}/${d.file}) |\n`
  }

  return table
}

function generateAlphaDownloadTable(): string {
  const baseUrl = `https://github.com/bling-yshs/genshin-planer/releases/download/alpha`

  // Alpha 版本的文件名包含 commit hash 的前 7 位
  // 但实际上 alpha release 的文件名可能不包含版本号，需要根据实际构建产物调整
  // 这里我们先列出所有平台，不包含具体文件名（因为 alpha 构建的文件名可能不固定）
  const downloads = [
    { os: 'Windows x64', emoji: '🪟' },
    { os: 'Windows ARM64', emoji: '🪟' },
    { os: 'macOS (Apple Silicon)', emoji: '🍎' },
    { os: 'macOS (Intel)', emoji: '🍎' },
    { os: 'Linux x64 (deb)', emoji: '🐧' },
    { os: 'Linux x64 (rpm)', emoji: '🐧' },
    { os: 'Linux ARM64 (deb)', emoji: '🐧' },
    { os: 'Linux ARM64 (rpm)', emoji: '🐧' },
  ]

  let table = '## 📥 下载\n\n'
  table += '> 💡 点击下方 **Assets** 展开下载列表\n\n'
  table += '| 平台 | 状态 |\n'
  table += '| :--- | :--- |\n'

  for (const d of downloads) {
    table += `| ${d.emoji} ${d.os} | ✅ 已构建 |\n`
  }

  table += `\n📦 **下载地址**: [Release Assets](${baseUrl})\n`

  return table
}

function main() {
  const args = parseArgs()

  if (args.mode === 'alpha') {
    const downloadTable = generateAlphaDownloadTable()

    const body = `🚧 **Alpha 预览版本**

此版本由 CI 自动构建，包含最新的代码变更。

${downloadTable}

---
**Commit**: \`${args.commit}\``

    console.log(body)
  }
  else {
    const downloadTable = generateDownloadTable(args.tag, args.platform)

    const body = `${args.changelog}

${downloadTable}

---
**Full Changelog**: ${args.changelogLink}`

    console.log(body)
  }
}

main()
