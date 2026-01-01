-- Update videos bucket to allow MKV files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/mpeg',
  'video/3gpp',
  'video/x-m4v',
  'video/x-matroska',
  'video/x-flv',
  'video/avi'
]
WHERE id = 'videos';