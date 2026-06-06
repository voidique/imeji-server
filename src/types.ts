import type { Session, User } from '@/lib/auth'

export type AppBindings = {
  Variables: {
    user: User | null
    session: Session | null
    requestId: string
  }
}
