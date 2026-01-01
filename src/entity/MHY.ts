export interface MHYApiResponse<T> {
  retcode: number
  message: string
  data: T
}
