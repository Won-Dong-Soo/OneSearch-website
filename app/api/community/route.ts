import {
  cleanCommunityText,
  communityJson,
  hasTooManyLinks,
  managementCodeHash,
  publicCommunityPost,
  requestIpHash,
  type CommunityPostRow,
  validPostType,
} from "../../../db/community-store";
import { requireDatabase } from "../../../db/license-store";

type CreatePostBody = {
  type?: string;
  title?: string;
  body?: string;
  authorName?: string;
  managementCode?: string;
  website?: string;
};

export async function GET(request: Request) {
  const requestedType = new URL(request.url).searchParams.get("type");
  const type = validPostType(requestedType) ?? "question";
  const result = await requireDatabase()
    .prepare(`SELECT p.id, p.type, p.title, p.body, p.author_name, p.status, p.created_at, p.updated_at,
      COUNT(c.id) AS comment_count
      FROM community_posts p
      LEFT JOIN community_comments c ON c.post_id = p.id
      WHERE p.type = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 60`)
    .bind(type)
    .all<CommunityPostRow>();

  return communityJson({ posts: result.results.map(publicCommunityPost) });
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as CreatePostBody | null;
  if (input?.website) return communityJson({ ok: true });

  const type = validPostType(input?.type);
  const title = cleanCommunityText(input?.title, 100);
  const body = cleanCommunityText(input?.body, 3000);
  const authorName = cleanCommunityText(input?.authorName, 24);
  const authorSecretHash = await managementCodeHash(input?.managementCode);
  const ipHash = await requestIpHash(request);

  if (
    !type || title.length < 4 || body.length < 10 || authorName.length < 2 ||
    !authorSecretHash || !ipHash || hasTooManyLinks(`${title}\n${body}`)
  ) {
    return communityJson({ message: "제목, 내용, 닉네임과 관리 코드를 확인해 주세요." }, 400);
  }

  const database = requireDatabase();
  const recent = await database
    .prepare("SELECT COUNT(*) AS count FROM community_posts WHERE ip_hash = ? AND created_at >= ?")
    .bind(ipHash, new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .first<{ count: number }>();
  if ((recent?.count ?? 0) >= 5) {
    return communityJson({ message: "게시글 작성 한도를 초과했습니다. 잠시 후 다시 시도해 주세요." }, 429);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await database
    .prepare(`INSERT INTO community_posts
      (id, type, title, body, author_name, author_secret_hash, status, ip_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`) 
    .bind(id, type, title, body, authorName, authorSecretHash, ipHash, now, now)
    .run();

  return communityJson({ ok: true, id }, 201);
}
