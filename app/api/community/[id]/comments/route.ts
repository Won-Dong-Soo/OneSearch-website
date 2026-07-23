import {
  cleanCommunityText,
  communityJson,
  hasTooManyLinks,
  managementCodeHash,
  requestIpHash,
} from "../../../../../db/community-store";
import { requireDatabase } from "../../../../../db/license-store";

type CreateCommentBody = {
  body?: string;
  authorName?: string;
  managementCode?: string;
  website?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = cleanCommunityText(id, 80);
  const input = await request.json().catch(() => null) as CreateCommentBody | null;
  if (input?.website) return communityJson({ ok: true });

  const body = cleanCommunityText(input?.body, 1500);
  const authorName = cleanCommunityText(input?.authorName, 24);
  const authorSecretHash = await managementCodeHash(input?.managementCode);
  const ipHash = await requestIpHash(request);
  if (body.length < 2 || authorName.length < 2 || !authorSecretHash || !ipHash || hasTooManyLinks(body, 3)) {
    return communityJson({ message: "답변 내용, 닉네임과 관리 코드를 확인해 주세요." }, 400);
  }

  const database = requireDatabase();
  const post = await database.prepare("SELECT id FROM community_posts WHERE id = ? LIMIT 1").bind(postId).first();
  if (!post) return communityJson({ message: "게시글을 찾을 수 없습니다." }, 404);

  const recent = await database
    .prepare("SELECT COUNT(*) AS count FROM community_comments WHERE ip_hash = ? AND created_at >= ?")
    .bind(ipHash, new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .first<{ count: number }>();
  if ((recent?.count ?? 0) >= 20) {
    return communityJson({ message: "답변 작성 한도를 초과했습니다. 잠시 후 다시 시도해 주세요." }, 429);
  }

  const commentId = crypto.randomUUID();
  const now = new Date().toISOString();
  await database
    .prepare(`INSERT INTO community_comments
      (id, post_id, body, author_name, author_secret_hash, ip_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(commentId, postId, body, authorName, authorSecretHash, ipHash, now)
    .run();
  await database.prepare("UPDATE community_posts SET updated_at = ? WHERE id = ?").bind(now, postId).run();

  return communityJson({ ok: true, id: commentId }, 201);
}
