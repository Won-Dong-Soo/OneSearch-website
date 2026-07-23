import {
  cleanCommunityText,
  communityJson,
  managementCodeMatches,
  moderatorAuthorized,
  publicCommunityComment,
  publicCommunityPost,
  type CommunityCommentRow,
  type CommunityPostRow,
} from "../../../../db/community-store";
import { requireDatabase } from "../../../../db/license-store";

async function findPost(id: string): Promise<CommunityPostRow | null> {
  return requireDatabase()
    .prepare(`SELECT p.id, p.type, p.title, p.body, p.author_name, p.author_secret_hash,
      p.status, p.created_at, p.updated_at, COUNT(c.id) AS comment_count
      FROM community_posts p
      LEFT JOIN community_comments c ON c.post_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
      LIMIT 1`)
    .bind(id)
    .first<CommunityPostRow>();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const post = await findPost(cleanCommunityText(id, 80));
  if (!post) return communityJson({ message: "게시글을 찾을 수 없습니다." }, 404);

  const comments = await requireDatabase()
    .prepare(`SELECT id, post_id, body, author_name, created_at
      FROM community_comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 200`)
    .bind(post.id)
    .all<CommunityCommentRow>();
  return communityJson({
    post: publicCommunityPost(post),
    comments: comments.results.map(publicCommunityComment),
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const input = await request.json().catch(() => null) as { action?: string; managementCode?: string } | null;
  const post = await findPost(cleanCommunityText(id, 80));
  if (!post) return communityJson({ message: "게시글을 찾을 수 없습니다." }, 404);
  if (post.type !== "question" || !["answered", "open"].includes(input?.action ?? "")) {
    return communityJson({ message: "지원하지 않는 글 관리 작업입니다." }, 400);
  }
  if (
    !moderatorAuthorized(request) &&
    (!post.author_secret_hash || !await managementCodeMatches(input?.managementCode, post.author_secret_hash))
  ) {
    return communityJson({ message: "관리 코드가 올바르지 않습니다." }, 403);
  }

  await requireDatabase()
    .prepare("UPDATE community_posts SET status = ?, updated_at = ? WHERE id = ?")
    .bind(input?.action, new Date().toISOString(), post.id)
    .run();
  return communityJson({ ok: true, status: input?.action });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const input = await request.json().catch(() => null) as { managementCode?: string } | null;
  const post = await findPost(cleanCommunityText(id, 80));
  if (!post) return communityJson({ message: "게시글을 찾을 수 없습니다." }, 404);
  if (
    !moderatorAuthorized(request) &&
    (!post.author_secret_hash || !await managementCodeMatches(input?.managementCode, post.author_secret_hash))
  ) {
    return communityJson({ message: "관리 코드가 올바르지 않습니다." }, 403);
  }

  await requireDatabase().prepare("DELETE FROM community_posts WHERE id = ?").bind(post.id).run();
  return communityJson({ ok: true });
}
