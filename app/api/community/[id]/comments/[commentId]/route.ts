import {
  cleanCommunityText,
  communityJson,
  managementCodeMatches,
  moderatorAuthorized,
} from "../../../../../../db/community-store";
import { requireDatabase } from "../../../../../../db/license-store";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await context.params;
  const postId = cleanCommunityText(id, 80);
  const safeCommentId = cleanCommunityText(commentId, 80);
  const input = await request.json().catch(() => null) as { managementCode?: string } | null;
  const comment = await requireDatabase()
    .prepare("SELECT id, author_secret_hash FROM community_comments WHERE id = ? AND post_id = ? LIMIT 1")
    .bind(safeCommentId, postId)
    .first<{ id: string; author_secret_hash: string }>();
  if (!comment) return communityJson({ message: "답변을 찾을 수 없습니다." }, 404);
  if (!moderatorAuthorized(request) && !await managementCodeMatches(input?.managementCode, comment.author_secret_hash)) {
    return communityJson({ message: "관리 코드가 올바르지 않습니다." }, 403);
  }

  await requireDatabase().prepare("DELETE FROM community_comments WHERE id = ?").bind(comment.id).run();
  await requireDatabase()
    .prepare("UPDATE community_posts SET updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), postId)
    .run();
  return communityJson({ ok: true });
}
