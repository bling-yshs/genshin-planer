import type { Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'

export interface UpdateProgress {
  event: 'Started' | 'Progress' | 'Finished'
  contentLength?: number
  downloaded?: number
}

/**
 * 检查更新
 * @returns 如果有更新返回 Update 对象，否则返回 null
 */
export async function checkForUpdate(): Promise<Update | null> {
  try {
    const update = await check()
    return update
  }
  catch (error) {
    console.error('检查更新失败:', error)
    throw error
  }
}

/**
 * 下载并安装更新
 * @param update Update 对象
 * @param onProgress 进度回调
 */
export async function downloadAndInstallUpdate(
  update: Update,
  onProgress?: (progress: UpdateProgress) => void,
): Promise<void> {
  try {
    await update.downloadAndInstall((event) => {
      if (onProgress) {
        onProgress({
          event: event.event,
          contentLength: event.event === 'Started' ? event.data.contentLength : undefined,
          downloaded: event.event === 'Progress' ? event.data.chunkLength : undefined,
        })
      }
    })
  }
  catch (error) {
    console.error('下载安装更新失败:', error)
    throw error
  }
}

/**
 * 重启应用
 */
export async function relaunchApp(): Promise<void> {
  await relaunch()
}
