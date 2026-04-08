import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

/**
 * Shared Firebase Admin initialisation — single source of truth.
 * Replaces duplicated getAdminDb() across every API route.
 */
let _db = null
let _auth = null

function init() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  }
  _db = getFirestore()
  _auth = getAuth()
}

export function getAdminDb() {
  if (!_db) init()
  return _db
}

export function getAdminAuth() {
  if (!_auth) init()
  return _auth
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns decoded token with uid, email, etc. or null if invalid.
 *
 * Usage in API routes:
 *   const user = await verifyToken(req)
 *   if (!user) return Response('Unauthorized', { status: 401 })
 */
export async function verifyToken(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) return null

    const idToken = authHeader.split("Bearer ")[1]
    if (!idToken) return null

    const decoded = await getAdminAuth().verifyIdToken(idToken)
    return decoded // { uid, email, ... }
  } catch {
    return null
  }
}

/**
 * Check if a verified user has admin role in Firestore.
 */
export async function isAdmin(uid) {
  if (!uid) return false
  const db = getAdminDb()
  const snap = await db.collection("users").doc(uid).collection("profile").doc("account").get()
  return snap.exists && snap.data()?.role === "admin"
}

/**
 * Full admin gate — verify token + check admin role.
 * Returns { uid, email } if admin, null otherwise.
 */
export async function requireAdmin(req) {
  const user = await verifyToken(req)
  if (!user) return null
  const admin = await isAdmin(user.uid)
  return admin ? user : null
}
