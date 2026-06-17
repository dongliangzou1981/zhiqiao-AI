import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
    revisionId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id, revisionId } = await context.params;

    if (!id || !revisionId) {
      return NextResponse.json({ error: "缺少课件或修订版本 id" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const profile = await getProfile(supabase, user.id);
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "只有教师可以放弃课件优化版本" }, { status: 403 });
    }

    const { data: revision, error: revisionError } = await supabase
      .from("courseware_revisions")
      .select("id")
      .eq("id", revisionId)
      .eq("courseware_id", id)
      .eq("status", "pending")
      .maybeSingle();

    if (revisionError) {
      throw revisionError;
    }

    if (!revision) {
      return NextResponse.json({ error: "未找到可放弃的课件优化版本" }, { status: 404 });
    }

    const admin = createAdminClient();
    const { error: updateRevisionError } = await admin
      .from("courseware_revisions")
      .update({
        status: "discarded",
        applied_at: null,
      })
      .eq("id", revisionId)
      .eq("courseware_id", id)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (updateRevisionError) {
      throw updateRevisionError;
    }

    return NextResponse.json({ discarded: true, record: { id }, revision: { id: revisionId } });
  } catch (error) {
    console.error("[courseware-revision-discard]", error);
    const detail = error instanceof Error ? error.message : JSON.stringify(error);

    return NextResponse.json(
      { error: `放弃课件优化版本失败：${detail}` },
      { status: 500 }
    );
  }
}
