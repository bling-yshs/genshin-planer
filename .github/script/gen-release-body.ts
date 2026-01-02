/**
 * 生成 Release Body (包含下载表格)
 *
 * 使用方式: npx tsx gen-release-body.ts \
 *   --version <版本号> \
 *   --tag <版本标签> \
 *   --changelog <更新日志> \
 *   --changelog-link <Full Changelog 链接> \
 *   --platform <github|cnb>
 *
 * 输出: Release Body 内容 (直接输出到 stdout)
 */

import process from 'node:process'

interface Args {
  version: string
  tag: string
  changelog: string
  changelogLink: string
  platform: 'github' | 'cnb'
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Record<string, string> = {}

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '').replace(/-/g, '_')
      result[key] = args[i + 1]
      i += 2
    }
    else {
      i++
    }
  }

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
    { os: 'Windows', file: `genshin-planner_${tag.replace('v', '')}_x64-setup.exe`, emoji: '🪟' },
    { os: 'macOS', file: `genshin-planner_${tag.replace('v', '')}_x64.dmg`, emoji: '🍎' },
    { os: 'Linux (deb)', file: `genshin-planner_${tag.replace('v', '')}_amd64.deb`, emoji: '🐧' },
    { os: 'Linux (rpm)', file: `genshin-planner-${tag.replace('v', '')}-1.x86_64.rpm`, emoji: '🐧' },
    { os: 'Linux (AppImage)', file: `genshin-planner_${tag.replace('v', '')}_amd64.AppImage`, emoji: '🐧' },
  ]

  let table = '## 📥 下载\n\n'
  table += '| 平台 | 下载链接 |\n'
  table += '| :--- | :--- |\n'

  for (const d of downloads) {
    table += `| ${d.emoji} ${d.os} | [${d.file}](${baseUrl}/${d.file}) |\n`
  }

  return table
}

function main() {
  const { tag, changelog, changelogLink, platform } = parseArgs()

  const downloadTable = generateDownloadTable(tag, platform)

  const body = `${changelog}

${downloadTable}

---
**Full Changelog**: ${changelogLink}`

  console.log(body)
}

main()
