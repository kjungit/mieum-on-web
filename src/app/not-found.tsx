import Link from "next/link";

// 없는 주소(지운 제품·촬영 기록 링크 등)로 들어왔을 때. Next 기본 영어 404 대신 홈으로 돌아갈 길을 준다.
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <p className="text-lg font-black tracking-tight">페이지를 찾을 수 없어요</p>
      <p className="text-sm text-text-secondary">주소가 바뀌었거나 삭제된 화면이에요.</p>
      <Link href="/" className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">
        홈으로 가기
      </Link>
    </main>
  );
}
