// Vercel serverless function for every /api route (see vercel.json and server/app.js).
import { handle } from '../server/app.js'

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle
export const OPTIONS = handle
