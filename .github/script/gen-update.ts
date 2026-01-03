/**
 * 生成 Tauri update.json
 *
 * 使用方式: npx tsx gen-update.ts \
 *   --version <版本号> \
 *   --changelog <更新日志> \
 *   --artifacts-dir <构建产物目录>
 *
 * 输出: 在 artifacts-dir 目录下生成 update.json
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'

interface UpdatePlatform {
  signature: string
  url: string
}

interface UpdateJson {
  version: string
  notes: string
  pub_date: string
  platforms: {
    'windows-x86_64'?: UpdatePlatform
    'darwin-x86_64'?: UpdatePlatform
  }
}

/**
 * 解析命令行参数
 */
function parseArgs(): { version: string, changelog: string, artifactsDir: string, baseUrl: string } {
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
  if (!result.changelog)
    throw new Error('缺少必须参数: --changelog')
  if (!result.artifacts_dir)
    throw new Error('缺少必须参数: --artifacts-dir')
  if (!result.base_url)
    throw new Error('缺少必须参数: --base-url')

  return {
    version: result.version,
    changelog: result.changelog,
    artifactsDir: result.artifacts_dir,
    baseUrl: result.base_url,
  }
}

/**
 * 递归查找文件
 */
function findFileRecursive(dir: string, pattern: RegExp): string | null {
  if (!fs.existsSync(dir))
    return null

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const found = findFileRecursive(fullPath, pattern)
      if (found)
        return found
    }
    else if (pattern.test(entry.name)) {
      return fullPath
    }
  }
  return null
}

/**
 * 读取签名文件
 */
function readSignature(sigPath: string): string {
  if (!fs.existsSync(sigPath)) {
    throw new Error(`签名文件不存在: ${sigPath}`)
  }
  return fs.readFileSync(sigPath, 'utf-8').trim()
}

async function main() {
  console.log('🔧 生成 Tauri update.json...')

  const { version, changelog, artifactsDir, baseUrl } = parseArgs()

  console.log(`   版本: ${version}`)
  console.log(`   产物目录: ${artifactsDir}`)
  console.log(`   基础 URL: ${baseUrl}`)

  const updateJson: UpdateJson = {
    version,
    notes: changelog,
    pub_date: new Date().toISOString(),
    platforms: {},
  }

  // Windows NSIS (.exe)
  const windowsExe = findFileRecursive(artifactsDir, /\.exe$/i)
  const windowsSig = findFileRecursive(artifactsDir, /\.exe\.sig$/i)
  if (windowsExe && windowsSig) {
    const fileName = path.basename(windowsExe)
    updateJson.platforms['windows-x86_64'] = {
      signature: readSignature(windowsSig),
      url: `${baseUrl}/${fileName}`,
    }
    console.log(`   ✅ Windows: ${fileName}`)
  }

  // macOS (.app.tar.gz)
  const macosApp = findFileRecursive(artifactsDir, /\.app\.tar\.gz$/i)
  const macosAppSig = findFileRecursive(artifactsDir, /\.app\.tar\.gz\.sig$/i)
  if (macosApp && macosAppSig) {
    const fileName = path.basename(macosApp)
    updateJson.platforms['darwin-x86_64'] = {
      signature: readSignature(macosAppSig),
      url: `${baseUrl}/${fileName}`,
    }
    console.log(`   ✅ macOS: ${fileName}`)
  }

  if (Object.keys(updateJson.platforms).length === 0) {
    throw new Error('未找到任何平台的构建产物')
  }

  // 写入 update.json
  const outputPath = path.join(artifactsDir, 'update.json')
  fs.writeFileSync(outputPath, JSON.stringify(updateJson, null, 2))
  console.log(`\n✅ update.json 已生成: ${outputPath}`)
}

main().catch((error) => {
  console.error('\n❌ 生成失败:', error.message)
  process.exit(1)
})
