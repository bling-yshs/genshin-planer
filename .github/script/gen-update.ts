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
    'windows-aarch64'?: UpdatePlatform
    'linux-x86_64'?: UpdatePlatform
    'linux-aarch64'?: UpdatePlatform
    'darwin-x86_64'?: UpdatePlatform
    'darwin-aarch64'?: UpdatePlatform
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

  // 递归查找所有匹配的文件
  function findAllFilesRecursive(dir: string, pattern: RegExp): string[] {
    const results: string[] = []
    if (!fs.existsSync(dir))
      return results

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...findAllFilesRecursive(fullPath, pattern))
      }
      else if (pattern.test(entry.name)) {
        results.push(fullPath)
      }
    }
    return results
  }

  // Windows NSIS (.exe)
  const windowsExes = findAllFilesRecursive(artifactsDir, /\.exe$/i)
  for (const exePath of windowsExes) {
    const fileName = path.basename(exePath)
    const sigPath = `${exePath}.sig`
    if (!fs.existsSync(sigPath))
      continue

    if (fileName.includes('x64')) {
      updateJson.platforms['windows-x86_64'] = {
        signature: readSignature(sigPath),
        url: `${baseUrl}/${fileName}`,
      }
      console.log(`   ✅ Windows x64: ${fileName}`)
    }
    else if (fileName.includes('arm64')) {
      updateJson.platforms['windows-aarch64'] = {
        signature: readSignature(sigPath),
        url: `${baseUrl}/${fileName}`,
      }
      console.log(`   ✅ Windows ARM64: ${fileName}`)
    }
  }

  // Linux deb (.deb) - 用于更新
  const linuxDebs = findAllFilesRecursive(artifactsDir, /\.deb$/i)
  for (const debPath of linuxDebs) {
    const fileName = path.basename(debPath)
    const sigPath = `${debPath}.sig`
    if (!fs.existsSync(sigPath))
      continue

    if (fileName.includes('amd64')) {
      updateJson.platforms['linux-x86_64'] = {
        signature: readSignature(sigPath),
        url: `${baseUrl}/${fileName}`,
      }
      console.log(`   ✅ Linux x64: ${fileName}`)
    }
    else if (fileName.includes('arm64') || fileName.includes('aarch64')) {
      updateJson.platforms['linux-aarch64'] = {
        signature: readSignature(sigPath),
        url: `${baseUrl}/${fileName}`,
      }
      console.log(`   ✅ Linux ARM64: ${fileName}`)
    }
  }

  // macOS (.app.tar.gz)
  const macosApps = findAllFilesRecursive(artifactsDir, /\.app\.tar\.gz$/i)
  for (const appPath of macosApps) {
    const fileName = path.basename(appPath)
    const sigPath = `${appPath}.sig`
    if (!fs.existsSync(sigPath))
      continue

    // macOS 文件名通常包含 x64 或 aarch64
    if (fileName.includes('x64') || fileName.includes('x86_64')) {
      updateJson.platforms['darwin-x86_64'] = {
        signature: readSignature(sigPath),
        url: `${baseUrl}/${fileName}`,
      }
      console.log(`   ✅ macOS Intel: ${fileName}`)
    }
    else if (fileName.includes('aarch64') || fileName.includes('arm64')) {
      updateJson.platforms['darwin-aarch64'] = {
        signature: readSignature(sigPath),
        url: `${baseUrl}/${fileName}`,
      }
      console.log(`   ✅ macOS ARM64: ${fileName}`)
    }
    else {
      // 如果没有架构标识，根据构建机器判断
      // macos-latest 是 ARM，macos-15-intel 是 x64
      // 这里假设没有标识的是默认架构（当前 runner 的架构）
      // 由于我们无法在脚本中确定，先假设为 ARM64（macos-latest 默认）
      updateJson.platforms['darwin-aarch64'] = {
        signature: readSignature(sigPath),
        url: `${baseUrl}/${fileName}`,
      }
      console.log(`   ✅ macOS (默认 ARM64): ${fileName}`)
    }
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
