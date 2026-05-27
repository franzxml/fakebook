import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Elysia, t } from 'elysia'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'

const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1'
const uploadBucket = process.env.UPLOADS_BUCKET
const publicBaseUrl = process.env.UPLOADS_PUBLIC_BASE_URL
const s3 = new S3Client({ region })

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const extensionByType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function cleanFolder(folder: string) {
  return folder === 'avatars' ? 'avatars' : 'posts'
}

function publicUrlForKey(key: string) {
  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${key}`
  }

  return `https://${uploadBucket}.s3.${region}.amazonaws.com/${key}`
}

export const uploadRoutes = new Elysia({ prefix: '/uploads' })
  .post(
    '/presign',
    async ({ body, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      if (!uploadBucket) {
        set.status = 500
        return errorPayload('Bucket upload belum dikonfigurasi.')
      }

      if (!allowedImageTypes.has(body.contentType)) {
        set.status = 400
        return errorPayload('Tipe gambar tidak didukung.')
      }

      const folder = cleanFolder(body.folder)
      const extension = extensionByType[body.contentType]
      const key = `${folder}/${user.id}/${crypto.randomUUID()}.${extension}`
      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: uploadBucket,
          Key: key,
          ContentType: body.contentType,
        }),
        { expiresIn: 60 * 5 },
      )

      return {
        uploadUrl,
        publicUrl: publicUrlForKey(key),
        key,
      }
    },
    {
      body: t.Object({
        contentType: t.String({ minLength: 1 }),
        folder: t.Union([t.Literal('avatars'), t.Literal('posts')]),
      }),
    },
  )
