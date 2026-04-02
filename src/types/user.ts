import { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserProfile extends User {
  linkedOrgIds: string[]
}
