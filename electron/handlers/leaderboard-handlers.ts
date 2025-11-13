import { ipcMain } from 'electron'
import https from 'https'

/**
 * 排行榜相关的IPC处理器
 */

interface FetchLeaderboardParams {
  gender: 0 | 1
  type: 1 | 2
  categoryId: number
  offset: number
  limit: number
}

/**
 * 注册排行榜处理器
 */
export function registerLeaderboardHandlers(): void {
  // 获取排行榜数据
  ipcMain.handle('leaderboard:fetch', async (_event, params: FetchLeaderboardParams) => {
    try {
      const { gender, type, categoryId, offset, limit } = params

      const url = new URL('https://fanqienovel.com/api/rank/category/list')
      url.searchParams.append('app_id', '2503')
      url.searchParams.append('rank_list_type', '3')
      url.searchParams.append('offset', offset.toString())
      url.searchParams.append('limit', limit.toString())
      url.searchParams.append('category_id', categoryId.toString())
      url.searchParams.append('rank_version', '')
      url.searchParams.append('gender', gender.toString())
      url.searchParams.append('rankMold', type.toString())

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'referer': `https://fanqienovel.com/rank/${gender}_${type}_${categoryId}`,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
      }

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = ''

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP error! status: ${res.statusCode}`))
            return
          }

          res.on('data', (chunk) => {
            responseData += chunk.toString()
          })

          res.on('end', () => {
            try {
              console.log('Response received, length:', responseData.length)
              const data = JSON.parse(responseData)
              console.log('Parsed data, book count:', data?.data?.book_list?.length || 0)
              resolve(data)
            } catch (error) {
              console.error('Failed to parse response:', error)
              reject(new Error('Failed to parse response JSON'))
            }
          })

          res.on('error', (error) => {
            reject(error)
          })
        })

        req.on('error', (error) => {
          reject(error)
        })

        req.end()
      })
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      throw error
    }
  })

  console.log('Leaderboard handlers registered')
}
