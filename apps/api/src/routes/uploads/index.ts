import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Elysia, t } from 'elysia'
import { config } from '../../config'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'

const s3 = new S3Client({ region: config.aws.region })

// Selaras dengan MAX_IMAGE_BYTES di frontend (validate-image-file.ts).
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

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
  if (config.aws.uploadsPublicBaseUrl) {
    return `${config.aws.uploadsPublicBaseUrl.replace(/\/$/, '')}/${key}`
  }

  return `https://${config.aws.uploadsBucket}.s3.${config.aws.region}.amazonaws.com/${key}`
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

      if (!config.aws.uploadsBucket) {
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
      // ContentLength ikut ditandatangani sehingga S3 menolak upload yang
      // ukurannya tidak sama dengan fileSize yang divalidasi di sini.
      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: config.aws.uploadsBucket,
          Key: key,
          ContentType: body.contentType,
          ContentLength: body.fileSize,
        }),
        {
          expiresIn: 60 * 5,
          signableHeaders: new Set(['content-type', 'content-length']),
        },
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
        fileSize: t.Integer({ minimum: 1, maximum: MAX_UPLOAD_BYTES }),
      }),
    },
  )
